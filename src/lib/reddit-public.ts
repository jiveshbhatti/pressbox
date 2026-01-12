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

// Client-side cache for threads (2 minute TTL)
const threadCache = new Map<string, { threads: GameThread[]; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

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

// Check if post matches the game - must mention BOTH teams
function matchesGame(post: ArcticPost, game: Game): boolean {
  const text = (post.title + ' ' + (post.selftext || '')).toLowerCase();

  // Get the last word of team name (usually the actual team name like "Patriots", "Chargers")
  const homeWords = game.homeTeam.name.split(' ');
  const awayWords = game.awayTeam.name.split(' ');
  const homeTeamName = homeWords[homeWords.length - 1].toLowerCase();
  const awayTeamName = awayWords[awayWords.length - 1].toLowerCase();

  // Check for team name or abbreviation
  const hasHome = text.includes(homeTeamName) ||
                  text.includes(game.homeTeam.abbreviation.toLowerCase());
  const hasAway = text.includes(awayTeamName) ||
                  text.includes(game.awayTeam.abbreviation.toLowerCase());

  // Must have BOTH teams mentioned to be a match for this specific game
  return hasHome && hasAway;
}

// Find game threads for a specific game using Arctic Shift
export async function findGameThreadsPublic(game: Game): Promise<GameThread[]> {
  // Check cache first
  const cacheKey = game.id;
  const cached = threadCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.threads;
  }

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

  // Search ALL subreddits in parallel for faster loading
  const allSubs = [mainSub, ...teamSubs];
  const allResults = await Promise.all(
    allSubs.map(async (subreddit) => {
      try {
        const posts = await searchArcticShift(subreddit, 'game thread');
        return { subreddit, posts, isMain: subreddit === mainSub };
      } catch (error) {
        console.error(`Error searching ${subreddit}:`, error);
        return { subreddit, posts: [], isMain: subreddit === mainSub };
      }
    })
  );

  // Process results - main subreddit threads are marked as main
  for (const { subreddit, posts, isMain } of allResults) {
    for (const post of posts) {
      if (seenIds.has(post.id)) continue;

      if (isGameThread(post) && matchesGame(post, game)) {
        seenIds.add(post.id);
        threads.push({
          post: toRedditPost(post),
          subreddit,
          isMainThread: isMain,
        });
      }
    }
  }

  // Sort: main thread first, then by comment count
  const sortedThreads = threads.sort((a, b) => {
    if (a.isMainThread && !b.isMainThread) return -1;
    if (!a.isMainThread && b.isMainThread) return 1;
    return b.post.num_comments - a.post.num_comments;
  });

  // Cache the results
  threadCache.set(cacheKey, { threads: sortedThreads, timestamp: Date.now() });

  return sortedThreads;
}
