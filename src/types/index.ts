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
  stickied?: boolean;
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
  record?: string; // e.g., "14-3"
  color?: string;
  alternateColor?: string;
  isFavorite?: boolean;
}

export interface GameSituation {
  possession?: string; // team abbreviation with possession
  downDistanceText?: string; // e.g., "3rd & 2 at NE 3"
  lastPlay?: string; // description of last play
  isRedZone?: boolean;
  yardLine?: number;
  down?: number;
  homeTimeouts?: number;
  awayTimeouts?: number;
  odds?: {
    spread?: string;
    overUnder?: number;
  };
  probability?: {
    home?: number;
    away?: number;
  };
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
  // Live game details
  period?: number; // quarter/half
  clock?: string; // e.g., "8:18"
  statusDetail?: string; // e.g., "8:18 - 2nd Quarter" or "Final"
  situation?: GameSituation;
  leaders?: {
    teamId: string;
    player: string;
    stat: string;
    position?: string;
    headshot?: string;
  }[];
}

export interface GameThread {
  post: RedditPost;
  subreddit: string;
  isMainThread: boolean;
}
