// Public Reddit thread finder using Arctic Shift API
// Returns thread links that open directly in Reddit app
// Cannot fetch comments - just links to threads

import { RedditPost, Game, GameThread } from '@/types';
import { NFL_TEAM_SUBREDDITS, NBA_TEAM_SUBREDDITS } from './constants';

interface ArcticPost {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  permalink: string;
  url: string;
  selftext: string;
  created_utc: number;
  score: number;
  num_comments: number;
  link_flair_text?: string;
  stickied?: boolean;
}

interface ArcticResponse {
  data: ArcticPost[];
}

// Get Unix timestamp for start of today (midnight local time)
function getTodayStartTimestamp(): number {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor(startOfDay.getTime() / 1000);
}

// Search for posts using Arctic Shift API (via our proxy)
async function searchArcticShift(subreddit: string, query?: string): Promise<ArcticPost[]> {
  const params = new URLSearchParams({ subreddit });
  if (query) params.set('q', query);

  // Only get posts from today
  params.set('after', getTodayStartTimestamp().toString());

  const response = await fetch(`/api/reddit?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Arctic Shift API error: ${response.status}`);
  }

  const data: ArcticResponse = await response.json();
  return data.data || [];
}

// Convert Arctic Shift post to our RedditPost type
function toRedditPost(post: ArcticPost): RedditPost {
  return {
    id: post.id,
    title: post.title,
    author: post.author,
    subreddit: post.subreddit,
    permalink: post.permalink || `/r/${post.subreddit}/comments/${post.id}`,
    url: post.url,
    selftext: post.selftext || '',
    created_utc: post.created_utc,
    score: post.score || 0,
    num_comments: post.num_comments || 0,
    link_flair_text: post.link_flair_text,
    stickied: post.stickied || false,
  };
}

// Check if a post is a game thread
function isGameThread(post: ArcticPost): boolean {
  const title = post.title.toLowerCase();
  const flair = (post.link_flair_text || '').toLowerCase();

  const gameThreadIndicators = [
    'game thread',
    'gamethread',
    'game day thread',
    'gdt',
    'match thread',
    'post game thread',
    'postgame thread',
  ];

  return gameThreadIndicators.some(
    indicator => title.includes(indicator) || flair.includes(indicator)
  );
}

// Check if post matches the game
function matchesGame(post: ArcticPost, game: Game): boolean {
  const text = (post.title + ' ' + (post.selftext || '')).toLowerCase();

  const homeTerms = [
    game.homeTeam.abbreviation.toLowerCase(),
    game.homeTeam.name.toLowerCase(),
    ...game.homeTeam.name.split(' ').map(w => w.toLowerCase()),
  ];

  const awayTerms = [
    game.awayTeam.abbreviation.toLowerCase(),
    game.awayTeam.name.toLowerCase(),
    ...game.awayTeam.name.split(' ').map(w => w.toLowerCase()),
  ];

  const hasHome = homeTerms.some(term => text.includes(term));
  const hasAway = awayTerms.some(term => text.includes(term));

  return hasHome || hasAway;
}

// Find game threads for a specific game using Arctic Shift
export async function findGameThreadsPublic(game: Game): Promise<GameThread[]> {
  // Main subreddit first (NFL or NBA), then team subreddits
  const mainSub = game.sport === 'nfl' ? 'nfl' : 'nba';
  const teamSubs: string[] = [];

  if (game.sport === 'nfl') {
    const homeSub = NFL_TEAM_SUBREDDITS[game.homeTeam.abbreviation];
    const awaySub = NFL_TEAM_SUBREDDITS[game.awayTeam.abbreviation];
    if (homeSub) teamSubs.push(homeSub);
    if (awaySub) teamSubs.push(awaySub);
  } else {
    const homeSub = NBA_TEAM_SUBREDDITS[game.homeTeam.abbreviation];
    const awaySub = NBA_TEAM_SUBREDDITS[game.awayTeam.abbreviation];
    if (homeSub) teamSubs.push(homeSub);
    if (awaySub) teamSubs.push(awaySub);
  }

  const threads: GameThread[] = [];
  const seenIds = new Set<string>();

  // FIRST: Search main subreddit (NFL/NBA) - this is the priority
  try {
    const mainPosts = await searchArcticShift(mainSub, 'game thread');
    for (const post of mainPosts) {
      if (isGameThread(post) && matchesGame(post, game)) {
        seenIds.add(post.id);
        threads.push({
          post: toRedditPost(post),
          subreddit: mainSub,
          isMainThread: true,
        });
      }
    }
  } catch (error) {
    console.error(`Error searching ${mainSub}:`, error);
  }

  // SECOND: Search team subreddits in parallel (secondary)
  const teamResults = await Promise.all(
    teamSubs.map(async (subreddit) => {
      try {
        const posts = await searchArcticShift(subreddit, 'game thread');
        return { subreddit, posts };
      } catch (error) {
        console.error(`Error searching ${subreddit}:`, error);
        return { subreddit, posts: [] };
      }
    })
  );

  for (const { subreddit, posts } of teamResults) {
    for (const post of posts) {
      if (seenIds.has(post.id)) continue;

      if (isGameThread(post) && matchesGame(post, game)) {
        seenIds.add(post.id);
        threads.push({
          post: toRedditPost(post),
          subreddit,
          isMainThread: false,
        });
      }
    }
  }

  // Sort: main thread first, then by comment count
  return threads.sort((a, b) => {
    if (a.isMainThread && !b.isMainThread) return -1;
    if (!a.isMainThread && b.isMainThread) return 1;
    return b.post.num_comments - a.post.num_comments;
  });
}
