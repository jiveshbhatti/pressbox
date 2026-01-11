import { Game, Sport } from '@/types';

// ESPN API endpoints (free, no key required)
const ESPN_NFL_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
const ESPN_NBA_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';

interface ESPNCompetitor {
  team: {
    id: string;
    name: string;
    abbreviation: string;
    logo?: string;
  };
  score?: string;
  homeAway: 'home' | 'away';
}

interface ESPNEvent {
  id: string;
  date: string;
  status: {
    type: {
      name: string;
      state: 'pre' | 'in' | 'post';
    };
  };
  competitions: Array<{
    competitors: ESPNCompetitor[];
    venue?: {
      fullName: string;
    };
  }>;
}

interface ESPNScoreboard {
  events: ESPNEvent[];
}

function parseESPNGame(event: ESPNEvent, sport: Sport): Game {
  const competition = event.competitions[0];
  const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
  const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

  if (!homeTeam || !awayTeam) {
    throw new Error('Invalid game data');
  }

  let status: Game['status'] = 'scheduled';
  if (event.status.type.state === 'in') {
    status = 'in_progress';
  } else if (event.status.type.state === 'post') {
    status = 'final';
  }

  return {
    id: event.id,
    sport,
    homeTeam: {
      id: homeTeam.team.id,
      name: homeTeam.team.name,
      abbreviation: homeTeam.team.abbreviation,
      logo: homeTeam.team.logo,
    },
    awayTeam: {
      id: awayTeam.team.id,
      name: awayTeam.team.name,
      abbreviation: awayTeam.team.abbreviation,
      logo: awayTeam.team.logo,
    },
    homeScore: homeTeam.score ? parseInt(homeTeam.score, 10) : undefined,
    awayScore: awayTeam.score ? parseInt(awayTeam.score, 10) : undefined,
    status,
    startTime: event.date,
    venue: competition.venue?.fullName,
  };
}

export async function getNFLGames(): Promise<Game[]> {
  try {
    const response = await fetch(ESPN_NFL_SCOREBOARD);
    if (!response.ok) throw new Error('Failed to fetch NFL games');

    const data: ESPNScoreboard = await response.json();
    return data.events.map(event => parseESPNGame(event, 'nfl'));
  } catch (error) {
    console.error('Error fetching NFL games:', error);
    return [];
  }
}

export async function getNBAGames(): Promise<Game[]> {
  try {
    const response = await fetch(ESPN_NBA_SCOREBOARD);
    if (!response.ok) throw new Error('Failed to fetch NBA games');

    const data: ESPNScoreboard = await response.json();
    return data.events.map(event => parseESPNGame(event, 'nba'));
  } catch (error) {
    console.error('Error fetching NBA games:', error);
    return [];
  }
}

export async function getAllGames(): Promise<Game[]> {
  const [nflGames, nbaGames] = await Promise.all([
    getNFLGames(),
    getNBAGames(),
  ]);

  // Sort by status (in_progress first, then scheduled, then final) and start time
  const statusOrder = { in_progress: 0, scheduled: 1, final: 2 };

  return [...nflGames, ...nbaGames].sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });
}

// Build search query for finding game threads
export function buildGameThreadQuery(game: Game): string {
  const homeAbbr = game.homeTeam.abbreviation;
  const awayAbbr = game.awayTeam.abbreviation;
  const homeName = game.homeTeam.name.split(' ').pop() || game.homeTeam.name;
  const awayName = game.awayTeam.name.split(' ').pop() || game.awayTeam.name;

  // Try various formats game threads use
  return `(${homeAbbr} OR ${awayAbbr} OR "${homeName}" OR "${awayName}") AND (game thread OR gamethread)`;
}
