// Reddit types
export interface RedditToken {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  scope: string;
}

export interface RedditUser {
  name: string;
  icon_img: string;
}

export interface RedditComment {
  id: string;
  author: string;
  body: string;
  body_html: string;
  created_utc: number;
  score: number;
  replies?: RedditCommentListing;
  author_flair_text?: string;
  distinguished?: string;
  stickied?: boolean;
  depth?: number;
}

export interface RedditCommentListing {
  kind: string;
  data: {
    children: Array<{
      kind: string;
      data: RedditComment;
    }>;
  };
}

export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  created_utc: number;
  score: number;
  num_comments: number;
  url: string;
  permalink: string;
  subreddit: string;
  link_flair_text?: string;
}

export interface RedditSearchResult {
  kind: string;
  data: {
    children: Array<{
      kind: string;
      data: RedditPost;
    }>;
    after?: string;
  };
}

// Sports types
export type Sport = 'nfl' | 'nba';

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo?: string;
}

export interface Game {
  id: string;
  sport: Sport;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number;
  awayScore?: number;
  status: 'scheduled' | 'in_progress' | 'final';
  startTime: string;
  venue?: string;
}

export interface GameThread {
  post: RedditPost;
  subreddit: string;
  isMainThread: boolean;
}
