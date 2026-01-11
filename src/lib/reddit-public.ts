// Public Reddit JSON API (no auth required)
// Uses our API proxy to avoid CORS issues
// Cannot post, vote, or access private content

import { RedditPost, RedditComment, Game, GameThread } from '@/types';
import { NFL_TEAM_SUBREDDITS, NBA_TEAM_SUBREDDITS } from './constants';

interface RedditListingResponse {
  kind: string;
  data: {
    children: Array<{
      kind: string;
      data: RedditPost;
    }>;
    after?: string;
  };
}

interface RedditCommentsResponse {
  kind: string;
  data: {
    children: Array<{
      kind: string;
      data: RedditComment;
    }>;
  };
}

// Fetch from our proxy API
async function fetchReddit(path: string) {
  const response = await fetch(`/api/reddit?path=${encodeURIComponent(path)}`);

  if (!response.ok) {
    throw new Error(`Reddit API error: ${response.status}`);
  }

  return response.json();
}

// Fetch hot posts from a subreddit (public)
export async function getSubredditPosts(
  subreddit: string,
  limit = 50
): Promise<RedditPost[]> {
  try {
    const data: RedditListingResponse = await fetchReddit(
      `/r/${subreddit}/hot.json?limit=${limit}`
    );
    return data.data.children.map(c => c.data);
  } catch (error) {
    console.error(`Error fetching ${subreddit}:`, error);
    return [];
  }
}

// Fetch comments for a post (public)
export async function getPostCommentsPublic(
  subreddit: string,
  postId: string,
  sort: 'new' | 'best' | 'top' | 'controversial' = 'new',
  limit = 100
): Promise<{ post: RedditPost; comments: RedditComment[] }> {
  try {
    const data: [RedditListingResponse, RedditCommentsResponse] = await fetchReddit(
      `/r/${subreddit}/comments/${postId}.json?sort=${sort}&limit=${limit}`
    );

    const post = data[0].data.children[0]?.data;
    const comments = data[1].data.children
      .filter(c => c.kind === 't1' && c.data.body) // t1 = comment
      .map(c => c.data);

    return { post, comments };
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
}

// Check if a post is a game thread
function isGameThread(post: RedditPost): boolean {
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
function matchesGame(post: RedditPost, game: Game): boolean {
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

// Find game threads for a specific game (public, no auth)
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

  // Fetch from each subreddit in parallel
  const results = await Promise.all(
    subreddits.map(async (subreddit) => {
      const posts = await getSubredditPosts(subreddit);
      return { subreddit, posts };
    })
  );

  for (const { subreddit, posts } of results) {
    for (const post of posts) {
      if (seenIds.has(post.id)) continue;

      if (isGameThread(post) && matchesGame(post, game)) {
        seenIds.add(post.id);
        threads.push({
          post,
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
