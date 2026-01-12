// Public Reddit thread finder using Pullpush API
// Returns thread links that open directly in Reddit app
// Cannot fetch comments - just links to threads

import { RedditPost, Game, GameThread } from '@/types';
import { NFL_TEAM_SUBREDDITS, NBA_TEAM_SUBREDDITS } from './constants';

interface PullpushPost {
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

interface PullpushResponse {
  data: PullpushPost[];
}

// Search for posts using Pullpush API (via our proxy)
async function searchPullpush(subreddit: string, query?: string): Promise<PullpushPost[]> {
  const params = new URLSearchParams({ subreddit });
  if (query) params.set('q', query);

  const response = await fetch(`/api/reddit?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Pullpush API error: ${response.status}`);
  }

  const data: PullpushResponse = await response.json();
  return data.data || [];
}

// Convert Pullpush post to our RedditPost type
function toRedditPost(post: PullpushPost): RedditPost {
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
function isGameThread(post: PullpushPost): boolean {
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
function matchesGame(post: PullpushPost, game: Game): boolean {
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

// Find game threads for a specific game using Pullpush
export async function findGameThreadsPublic(game: Game): Promise<GameThread[]> {
  const subreddits: string[] = [];

  // Add main subreddit
  if (game.sport === 'nfl') {
    subreddits.push('nfl');
    const homeSub = NFL_TEAM_SUBREDDITS[game.homeTeam.abbreviation];
    const awaySub = NFL_TEAM_SUBREDDITS[game.awayTeam.abbreviation];
    if (homeSub) subreddits.push(homeSub);
    if (awaySub) subreddits.push(awaySub);
  } else {
    subreddits.push('nba');
    const homeSub = NBA_TEAM_SUBREDDITS[game.homeTeam.abbreviation];
    const awaySub = NBA_TEAM_SUBREDDITS[game.awayTeam.abbreviation];
    if (homeSub) subreddits.push(homeSub);
    if (awaySub) subreddits.push(awaySub);
  }

  const threads: GameThread[] = [];
  const seenIds = new Set<string>();

  // Search each subreddit for game threads
  const results = await Promise.all(
    subreddits.map(async (subreddit) => {
      try {
        // Search for "game thread" in each subreddit
        const posts = await searchPullpush(subreddit, 'game thread');
        return { subreddit, posts };
      } catch (error) {
        console.error(`Error searching ${subreddit}:`, error);
        return { subreddit, posts: [] };
      }
    })
  );

  for (const { subreddit, posts } of results) {
    for (const post of posts) {
      if (seenIds.has(post.id)) continue;

      if (isGameThread(post) && matchesGame(post, game)) {
        seenIds.add(post.id);
        threads.push({
          post: toRedditPost(post),
          subreddit,
          isMainThread: subreddit === 'nfl' || subreddit === 'nba',
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
