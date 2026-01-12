import { Game, Sport, GameSituation } from '@/types';

// ESPN API endpoints (free, no key required)
const ESPN_NFL_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
const ESPN_NBA_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';

interface ESPNCompetitor {
  team: {
    id: string;
    name: string;
    abbreviation: string;
    logo?: string;
    color?: string;
    alternateColor?: string;
  };
  score?: string;
  homeAway: 'home' | 'away';
  records?: Array<{
    type: string;
    summary: string;
  }>;
}

interface ESPNSituation {
  possession?: string;
  downDistanceText?: string;
  shortDownDistanceText?: string;
  isRedZone?: boolean;
  yardLine?: number;
  down?: number;
  homeTimeouts?: number;
  awayTimeouts?: number;
  lastPlay?: {
    text?: string;
  };
}

interface ESPNEvent {
  id: string;
  date: string;
  status: {
    type: {
      name: string;
      state: 'pre' | 'in' | 'post';
      detail?: string;
      shortDetail?: string;
    };
    period?: number;
    displayClock?: string;
  };
  competitions: Array<{
    competitors: ESPNCompetitor[];
    venue?: {
      fullName: string;
    };
    situation?: ESPNSituation;
  }>;
}

interface ESPNScoreboard {
  events: ESPNEvent[];
}

function parseESPNGame(event: ESPNEvent, sport: Sport): Game {
  const competition = event.competitions[0];
  const homeCompetitor = competition.competitors.find(c => c.homeAway === 'home');
  const awayCompetitor = competition.competitors.find(c => c.homeAway === 'away');

  if (!homeCompetitor || !awayCompetitor) {
    throw new Error('Invalid game data');
  }

  let status: Game['status'] = 'scheduled';
  if (event.status.type.state === 'in') {
    status = 'in_progress';
  } else if (event.status.type.state === 'post') {
    status = 'final';
  }

  // Get team records
  const homeRecord = homeCompetitor.records?.find(r => r.type === 'total')?.summary;
  const awayRecord = awayCompetitor.records?.find(r => r.type === 'total')?.summary;

  // Parse situation for live games
  let situation: GameSituation | undefined;
  if (competition.situation) {
    const sit = competition.situation;
    situation = {
      possession: sit.possession,
      downDistanceText: sit.shortDownDistanceText || sit.downDistanceText,
      lastPlay: sit.lastPlay?.text,
      isRedZone: sit.isRedZone,
      yardLine: sit.yardLine,
      down: sit.down,
      homeTimeouts: sit.homeTimeouts,
      awayTimeouts: sit.awayTimeouts,
    };
  }

  // Parse odds
  const odds = (competition as any).odds?.[0];
  if (odds && situation) {
    situation.odds = {
      spread: odds.details,
      overUnder: odds.overUnder,
    };
  }

  // Parse win probability
  const prob = (competition as any).probability;
  if (prob && situation) {
    // ESPN sometimes returns home/away probability
    situation.probability = {
      home: prob.homeWinPercentage,
      away: prob.awayWinPercentage,
    };
  }

  // Parse leaders
  const leaders: Game['leaders'] = [];
  const espnLeaders = (competition as any).leaders;
  if (espnLeaders && Array.isArray(espnLeaders)) {
    espnLeaders.forEach((l: any) => {
      // Structure: category.leaders[0].athlete/team
      const leader = l.leaders?.[0];
      if (leader) {
        leaders.push({
          teamId: leader.team?.id || leader.athlete?.team?.id || '',
          player: leader.athlete?.displayName || 'Unknown',
          stat: leader.displayValue || '',
          position: leader.athlete?.position?.abbreviation,
          headshot: leader.athlete?.headshot,
        });
      }
    });
  }

  return {
    id: event.id,
    sport,
    homeTeam: {
      id: homeCompetitor.team.id,
      name: homeCompetitor.team.name,
      abbreviation: homeCompetitor.team.abbreviation,
      logo: homeCompetitor.team.logo,
      record: homeRecord,
      color: homeCompetitor.team.color,
      alternateColor: homeCompetitor.team.alternateColor,
    },
    awayTeam: {
      id: awayCompetitor.team.id,
      name: awayCompetitor.team.name,
      abbreviation: awayCompetitor.team.abbreviation,
      logo: awayCompetitor.team.logo,
      record: awayRecord,
      color: awayCompetitor.team.color,
      alternateColor: awayCompetitor.team.alternateColor,
    },
    homeScore: homeCompetitor.score ? parseInt(homeCompetitor.score, 10) : undefined,
    awayScore: awayCompetitor.score ? parseInt(awayCompetitor.score, 10) : undefined,
    status,
    startTime: event.date,
    venue: competition.venue?.fullName,
    period: event.status.period,
    clock: event.status.displayClock,
    statusDetail: event.status.type.shortDetail || event.status.type.detail,
    situation,
    leaders,
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

export async function getGameDetails(id: string, sport: Sport): Promise<Game | null> {
  try {
    const baseUrl = sport === 'nfl'
      ? 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary'
      : 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary';

    const response = await fetch(`${baseUrl}?event=${id}`);
    if (!response.ok) throw new Error(`Failed to fetch ${sport} game details`);

    const data = await response.json();
    if (!data.header?.event) return null;

    // Use existing parser if possible, or adapt
    // The summary API has a different top-level but same event structure in header
    const event = {
      id: data.header.event.id,
      date: data.header.event.date,
      status: data.header.event.status,
      competitions: [{
        competitors: data.header.competitions[0].competitors,
        venue: data.gameInfo?.venue,
        situation: data.drives?.current?.description ? { lastPlay: { text: data.drives.current.description } } : undefined,
        leaders: data.leaders,
        odds: data.pickcenter?.[0] ? [data.pickcenter[0]] : undefined,
      }]
    };

    return parseESPNGame(event as any, sport);
  } catch (error) {
    console.error('Error fetching game details:', error);
    return null;
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
