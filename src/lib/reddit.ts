import { RedditToken, RedditUser, RedditSearchResult, RedditComment } from '@/types';
import { REDDIT_CLIENT_ID, REDDIT_REDIRECT_URI } from './constants';

const REDDIT_AUTH_URL = 'https://www.reddit.com/api/v1/authorize';
const REDDIT_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
const REDDIT_API_URL = 'https://oauth.reddit.com';

// Generate OAuth URL for login
export function getRedditAuthUrl(): string {
  const state = Math.random().toString(36).substring(7);
  localStorage.setItem('reddit_auth_state', state);

  const params = new URLSearchParams({
    client_id: REDDIT_CLIENT_ID,
    response_type: 'code',
    state,
    redirect_uri: REDDIT_REDIRECT_URI,
    duration: 'permanent',
    scope: 'identity read submit vote',
  });

  return `${REDDIT_AUTH_URL}?${params.toString()}`;
}

// Exchange code for tokens
export async function exchangeCodeForToken(code: string): Promise<RedditToken> {
  const response = await fetch('/api/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for token');
  }

  return response.json();
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<RedditToken> {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  return response.json();
}

// Get current user
export async function getCurrentUser(accessToken: string): Promise<RedditUser> {
  const response = await fetch(`${REDDIT_API_URL}/api/v1/me`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'Pressbox/1.0',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get user');
  }

  return response.json();
}

// Search for game threads in a subreddit
export async function searchGameThreads(
  accessToken: string,
  subreddit: string,
  query: string,
  limit = 10
): Promise<RedditSearchResult> {
  const params = new URLSearchParams({
    q: `${query} (flair:game thread OR flair:gamethread OR title:game thread)`,
    restrict_sr: 'true',
    sort: 'new',
    limit: limit.toString(),
    t: 'day',
  });

  const response = await fetch(
    `${REDDIT_API_URL}/r/${subreddit}/search?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'Pressbox/1.0',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to search ${subreddit}`);
  }

  return response.json();
}

// Get comments for a post
export async function getPostComments(
  accessToken: string,
  subreddit: string,
  postId: string,
  sort = 'new',
  limit = 100
): Promise<[{ data: { children: [{ data: unknown }] } }, { data: { children: Array<{ data: RedditComment }> } }]> {
  const params = new URLSearchParams({
    sort,
    limit: limit.toString(),
  });

  const response = await fetch(
    `${REDDIT_API_URL}/r/${subreddit}/comments/${postId}?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'Pressbox/1.0',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get comments');
  }

  return response.json();
}

// Post a comment
export async function postComment(
  accessToken: string,
  parentFullname: string, // t3_postid for post, t1_commentid for reply
  text: string
): Promise<{ json: { data: { things: Array<{ data: RedditComment }> } } }> {
  const response = await fetch(`${REDDIT_API_URL}/api/comment`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'Pressbox/1.0',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      api_type: 'json',
      thing_id: parentFullname,
      text,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to post comment');
  }

  return response.json();
}

// Vote on a post or comment
export async function vote(
  accessToken: string,
  fullname: string,
  direction: 1 | 0 | -1
): Promise<void> {
  const response = await fetch(`${REDDIT_API_URL}/api/vote`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'Pressbox/1.0',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      id: fullname,
      dir: direction.toString(),
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to vote');
  }
}

// Token management helpers
export function saveToken(token: RedditToken): void {
  localStorage.setItem('reddit_token', JSON.stringify(token));
}

export function getToken(): RedditToken | null {
  const stored = localStorage.getItem('reddit_token');
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function clearToken(): void {
  localStorage.removeItem('reddit_token');
  localStorage.removeItem('reddit_user');
}

export function isTokenExpired(token: RedditToken): boolean {
  return Date.now() >= token.expires_at - 60000; // 1 min buffer
}

export async function getValidToken(): Promise<string | null> {
  const token = getToken();
  if (!token) return null;

  if (isTokenExpired(token)) {
    try {
      const newToken = await refreshAccessToken(token.refresh_token);
      saveToken(newToken);
      return newToken.access_token;
    } catch {
      clearToken();
      return null;
    }
  }

  return token.access_token;
}
