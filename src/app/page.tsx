'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { AuthProvider } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { GameCard } from '@/components/GameCard';
import { ThreadList } from '@/components/ThreadList';
import { Game, GameThread, Sport } from '@/types';
import { getAllGames, getGameDetails } from '@/lib/sports';
import { findGameThreadsPublic } from '@/lib/reddit-public';
import { FieldMap } from '@/components/FieldMap';
import { PullToRefresh } from '@/components/PullToRefresh';
import { WinProbability } from '@/components/WinProbability';
import { NFL_TEAM_SUBREDDITS, NBA_TEAM_SUBREDDITS } from '@/lib/constants';

// Thread filter and sort types
type ThreadFilter = 'all' | 'live' | 'post-game';
type ThreadSort = 'active' | 'newest' | 'main-first' | 'favorites-first';

// Get subreddit for a team abbreviation
function getTeamSubreddit(abbr: string, sport: Sport): string | undefined {
  if (sport === 'nfl') return NFL_TEAM_SUBREDDITS[abbr];
  if (sport === 'nba') return NBA_TEAM_SUBREDDITS[abbr];
  return undefined;
}

function TeamLogo({ src, alt, size = 48 }: { src?: string; alt: string; size?: number }) {
  if (!src) {
    return (
      <div
        className="bg-slate-200 rounded-full flex items-center justify-center text-slate-600 text-sm font-black"
        style={{ width: size, height: size }}
      >
        {alt.substring(0, 3)}
      </div>
    );
  }
  return (
    <Image src={src} alt={alt} width={size} height={size} className="object-contain" unoptimized />
  );
}

function TimeoutIndicator({ counts, color, side }: { counts?: number; color: string; side: 'left' | 'right' }) {
  const dots = [1, 2, 3];
  return (
    <div className={`flex gap-1 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
      {dots.map(i => (
        <div
          key={i}
          className={`h-1 w-4 rounded-full transition-all duration-500 ${i <= (counts ?? 0) ? 'shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'opacity-20'}`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

function HomePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null); // For URL persistence
  const [threads, setThreads] = useState<GameThread[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isRefreshingThreads, setIsRefreshingThreads] = useState(false);
  const [sportFilter, setSportFilterState] = useState<Sport | 'all'>('all');
  const [threadFilter, setThreadFilterState] = useState<ThreadFilter>('all');
  const [threadSort, setThreadSortState] = useState<ThreadSort>('favorites-first');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState(true); // Dark mode by default
  const [showScorePop, setShowScorePop] = useState(false);

  // Trigger score pop when scores change
  useEffect(() => {
    if (selectedGame) {
      setShowScorePop(true);
      const timer = setTimeout(() => setShowScorePop(false), 800);
      return () => clearTimeout(timer);
    }
  }, [selectedGame?.awayScore, selectedGame?.homeScore]);

  // Wrapper functions that also save to localStorage
  const setSportFilter = useCallback((value: Sport | 'all') => {
    setSportFilterState(value);
    localStorage.setItem('pressbox_sportFilter', value);
  }, []);

  const setThreadFilter = useCallback((value: ThreadFilter) => {
    setThreadFilterState(value);
    localStorage.setItem('pressbox_threadFilter', value);
  }, []);

  const setThreadSort = useCallback((value: ThreadSort) => {
    setThreadSortState(value);
    localStorage.setItem('pressbox_threadSort', value);
  }, []);

  // Load all preferences from localStorage on mount
  useEffect(() => {
    // Load favorites
    const savedFavorites = localStorage.getItem('pressbox_favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Error parsing favorites:', e);
      }
    }

    // Load sport filter
    const savedSportFilter = localStorage.getItem('pressbox_sportFilter') as Sport | 'all' | null;
    if (savedSportFilter) setSportFilterState(savedSportFilter);

    // Load thread filter
    const savedThreadFilter = localStorage.getItem('pressbox_threadFilter') as ThreadFilter | null;
    if (savedThreadFilter) setThreadFilterState(savedThreadFilter);

    // Load thread sort
    const savedThreadSort = localStorage.getItem('pressbox_threadSort') as ThreadSort | null;
    if (savedThreadSort) setThreadSortState(savedThreadSort);

    // Load dark mode (default to true if not set)
    const savedDarkMode = localStorage.getItem('pressbox_darkMode');
    if (savedDarkMode === 'false') {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      // Default to dark mode
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // Check URL hash for game ID to restore
    const hash = window.location.hash.slice(1);
    if (hash.startsWith('game-')) {
      setSelectedGameId(hash.replace('game-', ''));
    }
  }, []);

  // Save favorites to localStorage
  const handleToggleFavorite = useCallback((teamAbbr: string) => {
    setFavorites(prev => {
      const next = prev.includes(teamAbbr)
        ? prev.filter(a => a !== teamAbbr)
        : [...prev, teamAbbr];
      localStorage.setItem('pressbox_favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  // Toggle dark mode
  const handleToggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('pressbox_darkMode', String(next));
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  }, []);

  // Restore selected game from URL hash when games load
  useEffect(() => {
    if (selectedGameId && games.length > 0 && !selectedGame) {
      const game = games.find(g => g.id === selectedGameId);
      if (game) {
        handleSelectGame(game);
      } else {
        // Game not found, clear the hash
        window.location.hash = '';
        setSelectedGameId(null);
      }
    }
  }, [selectedGameId, games, selectedGame]);

  // Fetch games on mount and refresh frequently for live scores
  const fetchGames = useCallback(async () => {
    try {
      const allGames = await getAllGames();
      setGames(allGames);
      // Also update selected game with fresh data
      if (selectedGame) {
        const details = await getGameDetails(selectedGame.id, selectedGame.sport);
        if (details) setSelectedGame(details);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setIsLoadingGames(false);
    }
  }, [selectedGame]);

  // Update selected game when games refresh
  useEffect(() => {
    if (selectedGame && games.length > 0) {
      const updated = games.find(g => g.id === selectedGame.id);
      if (updated && (updated.homeScore !== selectedGame.homeScore || updated.awayScore !== selectedGame.awayScore)) {
        setSelectedGame(updated);
      }
    }
  }, [games, selectedGame]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchGames();

    // Check for live games and set appropriate refresh interval
    const checkAndRefresh = () => {
      const hasLiveGame = games.some(g => g.status === 'in_progress');
      return hasLiveGame ? 30 * 1000 : 5 * 60 * 1000;
    };

    const interval = setInterval(fetchGames, checkAndRefresh());
    return () => clearInterval(interval);
  }, [fetchGames]); // Only depend on fetchGames, not games

  // Fetch threads when a game is selected
  const handleSelectGame = useCallback(async (game: Game) => {
    setSelectedGame(game);
    setSelectedGameId(game.id);
    setThreads([]);
    setIsLoadingThreads(true);

    // Set URL hash for persistence
    window.location.hash = `game-${game.id}`;

    try {
      // Fetch full details (leaders, stats) immediately
      const details = await getGameDetails(game.id, game.sport);
      if (details) setSelectedGame(details);

      // Use Pullpush to find game threads
      const gameThreads = await findGameThreadsPublic(game);
      setThreads(gameThreads);
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setIsLoadingThreads(false);
    }
  }, []);

  const handleBack = () => {
    setSelectedGame(null);
    setSelectedGameId(null);
    setThreads([]);
    // Clear URL hash
    window.location.hash = '';
  };

  // Refresh threads manually
  const handleRefreshThreads = useCallback(async () => {
    if (!selectedGame || isRefreshingThreads) return;
    setIsRefreshingThreads(true);
    try {
      const gameThreads = await findGameThreadsPublic(selectedGame);
      setThreads(gameThreads);
    } catch (error) {
      console.error('Error refreshing threads:', error);
    } finally {
      setIsRefreshingThreads(false);
    }
  }, [selectedGame, isRefreshingThreads]);

  // Get favorite team subreddits for sorting
  const favoriteSubreddits = useMemo(() => {
    if (!selectedGame) return new Set<string>();
    return new Set(
      favorites
        .map(abbr => getTeamSubreddit(abbr, selectedGame.sport))
        .filter((s): s is string => !!s)
        .map(s => s.toLowerCase())
    );
  }, [favorites, selectedGame]);

  // Filter and sort threads
  const filteredAndSortedThreads = useMemo(() => {
    let filtered = threads;

    // Apply filter
    if (threadFilter === 'live') {
      filtered = threads.filter(t => {
        const title = t.post.title.toLowerCase();
        return (title.includes('game thread') || title.includes('gamethread')) &&
          !title.includes('post game') && !title.includes('postgame');
      });
    } else if (threadFilter === 'post-game') {
      filtered = threads.filter(t => {
        const title = t.post.title.toLowerCase();
        return title.includes('post game') || title.includes('postgame');
      });
    }

    // Apply sort
    const sorted = [...filtered];
    if (threadSort === 'favorites-first') {
      sorted.sort((a, b) => {
        const aIsFav = favoriteSubreddits.has(a.subreddit.toLowerCase());
        const bIsFav = favoriteSubreddits.has(b.subreddit.toLowerCase());
        if (aIsFav && !bIsFav) return -1;
        if (!aIsFav && bIsFav) return 1;
        // Then by main thread
        if (a.isMainThread && !b.isMainThread) return -1;
        if (!a.isMainThread && b.isMainThread) return 1;
        return b.post.num_comments - a.post.num_comments;
      });
    } else if (threadSort === 'active') {
      sorted.sort((a, b) => b.post.num_comments - a.post.num_comments);
    } else if (threadSort === 'newest') {
      sorted.sort((a, b) => b.post.created_utc - a.post.created_utc);
    } else if (threadSort === 'main-first') {
      sorted.sort((a, b) => {
        if (a.isMainThread && !b.isMainThread) return -1;
        if (!a.isMainThread && b.isMainThread) return 1;
        return b.post.num_comments - a.post.num_comments;
      });
    }

    return sorted;
  }, [threads, threadFilter, threadSort]);

  const filteredGames = (sportFilter === 'all'
    ? games
    : games.filter(g => g.sport === sportFilter)
  ).sort((a, b) => {
    const aFav = favorites.includes(a.awayTeam.abbreviation) || favorites.includes(a.homeTeam.abbreviation);
    const bFav = favorites.includes(b.awayTeam.abbreviation) || favorites.includes(b.homeTeam.abbreviation);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return 0;
  });

  // Show thread list for selected game
  if (selectedGame) {
    const isLive = selectedGame.status === 'in_progress';
    const isFinal = selectedGame.status === 'final';
    const awayColor = selectedGame.awayTeam.color ? `#${selectedGame.awayTeam.color}` : '#64748b';
    const homeColor = selectedGame.homeTeam.color ? `#${selectedGame.homeTeam.color}` : '#475569';

    return (
      <div className="min-h-screen flex flex-col">
        <Header darkMode={darkMode} onToggleDarkMode={handleToggleDarkMode} />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4 transition-colors font-bold uppercase tracking-widest text-xs"
          >
            <span className="text-lg">←</span>
            <span>Back to games</span>
          </button>

          {/* Enhanced Scoreboard with Team Colors */}
          <div
            className="relative rounded-[40px] p-8 mb-8 shadow-xl shadow-slate-400/30 dark:shadow-black/50 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${awayColor}50 0%, rgba(255,255,255,0.3) 25%, rgba(255,255,255,0.3) 75%, ${homeColor}50 100%)`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            {/* Side color washes */}
            <div className="absolute inset-0 flex pointer-events-none rounded-[40px] overflow-hidden">
              <div className="w-1/2 h-full opacity-30" style={{ background: `linear-gradient(to right, ${awayColor}, transparent 60%)` }} />
              <div className="w-1/2 h-full opacity-30" style={{ background: `linear-gradient(to left, ${homeColor}, transparent 60%)` }} />
            </div>

            {/* Content */}
            <div className="relative z-10">
              {/* Status bar */}
              <div className="flex items-center justify-between mb-8">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full bg-slate-900/10 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-900/10 dark:border-white/20">
                  {selectedGame.sport}
                </span>
                {isLive ? (
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 text-[10px] font-black text-red-600 tracking-widest uppercase">
                      <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
                      LIVE
                    </span>
                    {selectedGame.statusDetail && (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedGame.statusDetail}</span>
                    )}
                  </div>
                ) : isFinal ? (
                  <span className="text-[10px] font-black text-slate-400 tracking-[0.4em] uppercase italic">Final Score</span>
                ) : (
                  <span className="text-[10px] font-black text-slate-400 tracking-[0.4em] uppercase italic">{selectedGame.statusDetail}</span>
                )}
              </div>

              {/* Teams and Score */}
              <div className="flex items-center justify-between gap-8 mb-8">
                {/* Away Team */}
                <div className="flex-1 flex flex-col items-center text-center">
                  <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-4 rounded-[28px] border border-white dark:border-slate-700 shadow-md mb-4 relative">
                    <TeamLogo src={selectedGame.awayTeam.logo} alt={selectedGame.awayTeam.abbreviation} size={64} />
                    {selectedGame.situation?.possession === selectedGame.awayTeam.id && (
                      <div className="absolute -right-2 -top-2 bg-white dark:bg-slate-800 rounded-full p-1.5 shadow-lg border border-slate-100 dark:border-slate-700 animate-bounce z-20">
                        <span className="text-xs">🏈</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="font-black text-slate-900 dark:text-white text-lg uppercase tracking-tight leading-tight">{selectedGame.awayTeam.name}</div>
                    <TimeoutIndicator counts={selectedGame.situation?.awayTimeouts} color={awayColor} side="left" />
                  </div>
                  <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 italic">{selectedGame.awayTeam.abbreviation}</div>
                  {selectedGame.awayTeam.record && (
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2 px-3 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/50">{selectedGame.awayTeam.record}</div>
                  )}
                </div>

                {/* Score */}
                <div className="flex flex-col items-center">
                  {(isLive || isFinal) ? (
                    <div className={`flex items-center gap-8 ${showScorePop ? 'animate-score-pop' : ''}`}>
                      <span className={`text-7xl font-black tabular-nums tracking-tighter ${selectedGame.awayScore! > selectedGame.homeScore! ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-600'}`}>
                        {selectedGame.awayScore}
                      </span>
                      <span className="text-3xl font-black text-slate-200 dark:text-slate-600">—</span>
                      <span className={`text-7xl font-black tabular-nums tracking-tighter ${selectedGame.homeScore! > selectedGame.awayScore! ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-600'}`}>
                        {selectedGame.homeScore}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.3em]">VS</div>
                    </div>
                  )}

                  {selectedGame.situation?.odds?.spread && (
                    <div className="mt-6 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                        {selectedGame.situation.odds.spread}
                      </span>
                    </div>
                  )}
                </div>

                {/* Home Team */}
                <div className="flex-1 flex flex-col items-center text-center">
                  <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-4 rounded-[28px] border border-white dark:border-slate-700 shadow-md mb-4 relative">
                    <TeamLogo src={selectedGame.homeTeam.logo} alt={selectedGame.homeTeam.abbreviation} size={64} />
                    {selectedGame.situation?.possession === selectedGame.homeTeam.id && (
                      <div className="absolute -left-2 -top-2 bg-white dark:bg-slate-800 rounded-full p-1.5 shadow-lg border border-slate-100 dark:border-slate-700 animate-bounce z-20">
                        <span className="text-xs">🏈</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="font-black text-slate-900 dark:text-white text-lg uppercase tracking-tight leading-tight">{selectedGame.homeTeam.name}</div>
                    <TimeoutIndicator counts={selectedGame.situation?.homeTimeouts} color={homeColor} side="right" />
                  </div>
                  <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 italic">{selectedGame.homeTeam.abbreviation}</div>
                  {selectedGame.homeTeam.record && (
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2 px-3 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/50">{selectedGame.homeTeam.record}</div>
                  )}
                </div>
              </div>

              {/* Match Leaders Section */}
              {selectedGame.leaders && selectedGame.leaders.length > 0 && (
                <div className="mt-12 pt-10 border-t border-slate-900/5 dark:border-white/10">
                  <div className="flex items-center justify-between mb-8 px-2">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">Match Leaders</span>
                    <div className="h-px flex-1 bg-slate-900/5 dark:bg-white/10 ml-6" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedGame.leaders.map((leader, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-[32px] bg-white/60 dark:bg-slate-800/60 border border-white/80 dark:border-slate-700/50 shadow-sm transition-all hover:bg-white/80 dark:hover:bg-slate-700/60 hover:shadow-md group/leader">
                        <div className="relative w-14 h-14 shrink-0">
                          {/* Team Color Ring */}
                          <div
                            className="absolute inset-x-0 inset-y-0 rounded-2xl opacity-20 group-hover/leader:opacity-40 transition-opacity"
                            style={{ backgroundColor: leader.teamId === selectedGame.awayTeam.id ? `#${selectedGame.awayTeam.color}` : `#${selectedGame.homeTeam.color}` }}
                          />
                          {leader.headshot ? (
                            <div className="relative w-full h-full overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-700 border border-white dark:border-slate-600 shadow-inner">
                              <Image
                                src={leader.headshot}
                                alt={leader.player}
                                width={56}
                                height={56}
                                className="object-contain scale-125 translate-y-2"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-full h-full rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-500 font-black text-lg">
                              {leader.player.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                              {leader.player}
                            </span>
                            <span className="text-[8px] font-black text-white dark:text-slate-900 px-2 py-0.5 rounded-full bg-slate-900 dark:bg-white uppercase tracking-widest shrink-0">
                              {leader.position || 'NFL'}
                            </span>
                          </div>
                          <div className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                            {leader.stat}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Win Probability & Drive Summary */}
              {isLive && (
                <div className="mt-8 pt-8 border-t border-slate-900/5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <WinProbability
                      homeProb={selectedGame.situation?.probability?.home}
                      awayProb={selectedGame.situation?.probability?.away}
                      homeColor={homeColor}
                      awayColor={awayColor}
                      homeAbbr={selectedGame.homeTeam.abbreviation}
                      awayAbbr={selectedGame.awayTeam.abbreviation}
                    />

                    {selectedGame.situation?.drive && (
                      <div className="px-6 py-4 rounded-[24px] bg-slate-50/50 dark:bg-white/5 border border-slate-900/5 dark:border-white/10">
                        <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Current Drive</div>
                        <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{selectedGame.situation.drive}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Game Situation (NFL) */}
              {isLive && selectedGame.situation?.downDistanceText && (
                <div className="mt-8 pt-6 border-t border-slate-900/5 dark:border-white/10 text-center">
                  <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${selectedGame.situation.isRedZone ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                    🏈 {selectedGame.situation.downDistanceText}
                    {selectedGame.situation.isRedZone && ' • Red Zone'}
                  </p>
                  {selectedGame.situation.lastPlay && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-bold uppercase tracking-tight line-clamp-2 italic">
                      "{selectedGame.situation.lastPlay}"
                    </p>
                  )}
                </div>
              )}

              {/* SVG Field Map (NFL Only) */}
              {selectedGame.sport === 'nfl' && (
                <div className="mt-8 px-2">
                  <FieldMap
                    yardLine={selectedGame.situation?.yardLine}
                    possession={selectedGame.situation?.possession}
                    homeTeamId={selectedGame.homeTeam.id}
                    awayTeamId={selectedGame.awayTeam.id}
                    awayColor={awayColor}
                    homeColor={homeColor}
                    sport={selectedGame.sport}
                  />
                </div>
              )}

              {!isLive && !isFinal && (
                <div className="mt-8 pt-6 border-t border-slate-900/5 dark:border-white/10 text-center">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                    Venue: {selectedGame.venue || 'TBD'}
                  </p>
                </div>
              )}
            </div>{/* Close content div */}
          </div>

          {/* Thread Controls */}
          <div className="mb-8 space-y-6">
            {/* Filter & Refresh Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 p-1 glass rounded-2xl">
                {(['all', 'live', 'post-game'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setThreadFilter(filter)}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${threadFilter === filter
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-[1.02]'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10'
                      }`}
                  >
                    {filter === 'all' ? 'All' : filter === 'live' ? 'Live' : 'Post Game'}
                  </button>
                ))}
              </div>
              <button
                onClick={handleRefreshThreads}
                disabled={isRefreshingThreads}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl glass-pill group/refresh disabled:opacity-50"
              >
                <div className={`w-6 h-6 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center transition-transform duration-500 group-hover/refresh:rotate-180`}>
                  <svg className={`w-3.5 h-3.5 text-white dark:text-slate-900 ${isRefreshingThreads ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Refresh</span>
              </button>
            </div>

            {/* Sort Row */}
            <div className="flex items-center gap-4 px-2">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] shrink-0">Sort By</span>
              <div className="flex items-center gap-2 flex-wrap">
                {(['favorites-first', 'active', 'newest', 'main-first'] as const).map(sort => (
                  <button
                    key={sort}
                    onClick={() => setThreadSort(sort)}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 glass-pill ${threadSort === sort
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-none shadow-sm'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
                      }`}
                  >
                    {sort === 'favorites-first' ? '★ Favs' : sort === 'active' ? 'Active' : sort === 'newest' ? 'New' : 'Main'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <PullToRefresh onRefresh={handleRefreshThreads} isRefreshing={isRefreshingThreads}>
            <ThreadList
              threads={filteredAndSortedThreads}
              selectedThreadId={null}
              onSelectThread={() => { }}
              isLoading={isLoadingThreads}
            />
          </PullToRefresh>
        </main>
      </div>
    );
  }

  // Show game list (home)
  return (
    <div className="min-h-screen flex flex-col">
      <Header darkMode={darkMode} onToggleDarkMode={handleToggleDarkMode} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4">
        {/* Sport filter - larger touch targets with extra spacing from cards */}
        <div className="relative z-20 bg-gradient-to-b from-slate-100 dark:from-slate-900 via-slate-50/80 dark:via-slate-900/80 to-transparent pt-2 pb-8 -mx-4 px-4 mb-4">
          <div className="flex items-center gap-4">
            {(['all', 'nfl', 'nba'] as const).map(sport => (
              <button
                key={sport}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSportFilter(sport);
                }}
                className={`px-8 py-4 rounded-2xl font-black text-sm transition-all uppercase tracking-widest min-w-[90px] shadow-sm ${sportFilter === sport
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg scale-105'
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-2 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500 active:scale-95'
                  }`}
              >
                {sport === 'all' ? 'All' : sport}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {isLoadingGames ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass rounded-3xl p-8 animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-20 mb-6" />
                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-2xl w-full mb-4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-3/4" />
              </div>
            ))}
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 dark:text-slate-500 text-lg">No games scheduled today</p>
            <p className="text-slate-500 dark:text-slate-600 text-sm mt-2">Check back later!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredGames.map(game => (
              <GameCard
                key={game.id}
                game={game}
                onClick={() => handleSelectGame(game)}
                onToggleFavorite={handleToggleFavorite}
                isAwayFavorite={favorites.includes(game.awayTeam.abbreviation)}
                isHomeFavorite={favorites.includes(game.homeTeam.abbreviation)}
              />
            ))}
          </div>
        )}
      </main>

      {/* PWA install hint for iOS */}
      <footer className="text-center py-4 text-xs text-slate-500 dark:text-slate-500">
        <p>Tap Share → Add to Home Screen for the app experience</p>
      </footer>
    </div>
  );
}

export default function Page() {
  return (
    <AuthProvider>
      <HomePage />
    </AuthProvider>
  );
}
