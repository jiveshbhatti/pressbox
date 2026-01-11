import { Game, GameThread, RedditPost } from '@/types';
import { NFL_TEAM_SUBREDDITS, NBA_TEAM_SUBREDDITS } from './constants';

const REDDIT_API_URL = 'https://oauth.reddit.com';

// Get relevant subreddits for a game
function getSubredditsForGame(game: Game): string[] {
  const subreddits: string[] = [];

  if (game.sport === 'nfl') {
    subreddits.push('nfl');
    const homeSubreddit = NFL_TEAM_SUBREDDITS[game.homeTeam.abbreviation];
    const awaySubreddit = NFL_TEAM_SUBREDDITS[game.awayTeam.abbreviation];
    if (homeSubreddit) subreddits.push(homeSubreddit);
    if (awaySubreddit) subreddits.push(awaySubreddit);
  } else {
    subreddits.push('nba');
    const homeSubreddit = NBA_TEAM_SUBREDDITS[game.homeTeam.abbreviation];
    const awaySubreddit = NBA_TEAM_SUBREDDITS[game.awayTeam.abbreviation];
    if (homeSubreddit) subreddits.push(homeSubreddit);
    if (awaySubreddit) subreddits.push(awaySubreddit);
  }

  return subreddits;
}

// Check if a post is a game thread
function isGameThread(post: RedditPost): boolean {
  const title = post.title.toLowerCase();
  const flair = (post.link_flair_text || '').toLowerCase();

  // Check for game thread indicators
  const gameThreadIndicators = [
    'game thread',
    'gamethread',
    'game day thread',
    'gdt',
    'match thread',
  ];

  const hasGameThreadTitle = gameThreadIndicators.some(indicator =>
    title.includes(indicator)
  );

  const hasGameThreadFlair = gameThreadIndicators.some(indicator =>
    flair.includes(indicator)
  );

  return hasGameThreadTitle || hasGameThreadFlair;
}

// Check if a post matches the game (has team names)
function matchesGame(post: RedditPost, game: Game): boolean {
  const text = (post.title + ' ' + post.selftext).toLowerCase();

  const homeTeamTerms = [
    game.homeTeam.abbreviation.toLowerCase(),
    game.homeTeam.name.toLowerCase(),
    ...game.homeTeam.name.split(' ').map(w => w.toLowerCase()),
  ];

  const awayTeamTerms = [
    game.awayTeam.abbreviation.toLowerCase(),
    game.awayTeam.name.toLowerCase(),
    ...game.awayTeam.name.split(' ').map(w => w.toLowerCase()),
  ];

  const hasHomeTeam = homeTeamTerms.some(term => text.includes(term));
  const hasAwayTeam = awayTeamTerms.some(term => text.includes(term));

  // Must mention at least one team, preferably both
  return hasHomeTeam || hasAwayTeam;
}

// Search for game threads
export async function findGameThreads(
  accessToken: string,
  game: Game
): Promise<GameThread[]> {
  const subreddits = getSubredditsForGame(game);
  const threads: GameThread[] = [];
  const seenIds = new Set<string>();

  // Search each subreddit
  for (const subreddit of subreddits) {
    try {
      // Get hot/new posts from the subreddit
      const response = await fetch(
        `${REDDIT_API_URL}/r/${subreddit}/hot?limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'Pressbox/1.0',
          },
        }
      );

      if (!response.ok) continue;

      const data = await response.json();
      const posts: RedditPost[] = data.data.children.map((c: { data: RedditPost }) => c.data);

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
    } catch (error) {
      console.error(`Error searching ${subreddit}:`, error);
    }
  }

  // Sort: main subreddit first, then by comment count
  return threads.sort((a, b) => {
    if (a.isMainThread && !b.isMainThread) return -1;
    if (!a.isMainThread && b.isMainThread) return 1;
    return b.post.num_comments - a.post.num_comments;
  });
}

// Get new comments since last fetch (for live updates)
export async function getNewComments(
  accessToken: string,
  subreddit: string,
  postId: string,
  limit = 25
): Promise<RedditPost[]> {
  const response = await fetch(
    `${REDDIT_API_URL}/r/${subreddit}/comments/${postId}?sort=new&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'Pressbox/1.0',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch comments');
  }

  const [, commentsData] = await response.json();
  return commentsData.data.children.map((c: { data: RedditPost }) => c.data);
}
