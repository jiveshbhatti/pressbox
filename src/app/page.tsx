'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { AuthProvider } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { GameCard } from '@/components/GameCard';
import { ThreadList } from '@/components/ThreadList';
import { Game, GameThread, Sport } from '@/types';
import { getAllGames } from '@/lib/sports';
import { findGameThreadsPublic } from '@/lib/reddit-public';

function TeamLogo({ src, alt, size = 48 }: { src?: string; alt: string; size?: number }) {
  if (!src) {
    return (
      <div
        className="bg-slate-700 rounded-full flex items-center justify-center text-gray-400 text-sm font-bold"
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

function HomePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [threads, setThreads] = useState<GameThread[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [sportFilter, setSportFilter] = useState<Sport | 'all'>('all');

  // Fetch games on mount and refresh frequently for live scores
  const fetchGames = useCallback(async () => {
    try {
      const allGames = await getAllGames();
      setGames(allGames);
      // Also update selected game with fresh data
      if (selectedGame) {
        const updated = allGames.find(g => g.id === selectedGame.id);
        if (updated) setSelectedGame(updated);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setIsLoadingGames(false);
    }
  }, [selectedGame]);

  useEffect(() => {
    fetchGames();
    // Refresh every 30 seconds for live scores, 5 minutes otherwise
    const hasLiveGame = games.some(g => g.status === 'in_progress');
    const interval = setInterval(fetchGames, hasLiveGame ? 30 * 1000 : 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchGames, games]);

  // Fetch threads when a game is selected
  const handleSelectGame = useCallback(async (game: Game) => {
    setSelectedGame(game);
    setThreads([]);
    setIsLoadingThreads(true);

    try {
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
    setThreads([]);
  };

  const filteredGames = sportFilter === 'all'
    ? games
    : games.filter(g => g.sport === sportFilter);

  // Show thread list for selected game
  if (selectedGame) {
    const isLive = selectedGame.status === 'in_progress';
    const isFinal = selectedGame.status === 'final';

    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <span>←</span>
            <span>Back to games</span>
          </button>

          {/* Enhanced Scoreboard */}
          <div className="bg-slate-800 rounded-xl p-4 mb-4 border border-slate-700">
            {/* Status bar */}
            <div className="flex items-center justify-between mb-4">
              <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                selectedGame.sport === 'nfl'
                  ? 'bg-green-900/50 text-green-400'
                  : 'bg-orange-900/50 text-orange-400'
              }`}>
                {selectedGame.sport}
              </span>
              {isLive ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-red-400">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    LIVE
                  </span>
                  {selectedGame.statusDetail && (
                    <span className="text-xs text-gray-400">{selectedGame.statusDetail}</span>
                  )}
                </div>
              ) : isFinal ? (
                <span className="text-xs font-medium text-gray-400">FINAL</span>
              ) : null}
            </div>

            {/* Teams and Score */}
            <div className="flex items-center justify-between gap-4">
              {/* Away Team */}
              <div className="flex-1 flex flex-col items-center text-center">
                <TeamLogo src={selectedGame.awayTeam.logo} alt={selectedGame.awayTeam.abbreviation} size={56} />
                <div className="mt-2 font-semibold text-sm">{selectedGame.awayTeam.name}</div>
                {selectedGame.awayTeam.record && (
                  <div className="text-xs text-gray-500">{selectedGame.awayTeam.record}</div>
                )}
              </div>

              {/* Score */}
              <div className="flex flex-col items-center">
                {(isLive || isFinal) ? (
                  <div className="flex items-center gap-3">
                    <span className={`text-4xl font-bold tabular-nums ${
                      selectedGame.awayScore! > selectedGame.homeScore! ? 'text-white' : 'text-gray-500'
                    }`}>
                      {selectedGame.awayScore}
                    </span>
                    <span className="text-2xl text-gray-600">-</span>
                    <span className={`text-4xl font-bold tabular-nums ${
                      selectedGame.homeScore! > selectedGame.awayScore! ? 'text-white' : 'text-gray-500'
                    }`}>
                      {selectedGame.homeScore}
                    </span>
                  </div>
                ) : (
                  <div className="text-lg font-medium text-gray-400">@</div>
                )}
              </div>

              {/* Home Team */}
              <div className="flex-1 flex flex-col items-center text-center">
                <TeamLogo src={selectedGame.homeTeam.logo} alt={selectedGame.homeTeam.abbreviation} size={56} />
                <div className="mt-2 font-semibold text-sm">{selectedGame.homeTeam.name}</div>
                {selectedGame.homeTeam.record && (
                  <div className="text-xs text-gray-500">{selectedGame.homeTeam.record}</div>
                )}
              </div>
            </div>

            {/* Game Situation (NFL) */}
            {isLive && selectedGame.situation?.downDistanceText && (
              <div className={`mt-4 pt-3 border-t border-slate-700 text-center ${
                selectedGame.situation.isRedZone ? 'text-red-400' : 'text-yellow-400'
              }`}>
                <p className="text-sm font-medium">
                  🏈 {selectedGame.situation.downDistanceText}
                  {selectedGame.situation.isRedZone && ' 🔴 Red Zone'}
                </p>
                {selectedGame.situation.lastPlay && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {selectedGame.situation.lastPlay}
                  </p>
                )}
              </div>
            )}
          </div>

          <ThreadList
            threads={threads}
            selectedThreadId={null}
            onSelectThread={() => {}}
            isLoading={isLoadingThreads}
          />
        </main>
      </div>
    );
  }

  // Show game list (home)
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4">
        {/* Sport filter */}
        <div className="flex items-center gap-2 mb-4">
          {(['all', 'nfl', 'nba'] as const).map(sport => (
            <button
              key={sport}
              onClick={() => setSportFilter(sport)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                sportFilter === sport
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-800 text-gray-400 hover:text-white'
              }`}
            >
              {sport === 'all' ? 'All Games' : sport.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {isLoadingGames ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-slate-800 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-16 mb-4" />
                <div className="h-5 bg-slate-700 rounded w-48 mb-2" />
                <div className="h-5 bg-slate-700 rounded w-40" />
              </div>
            ))}
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No games scheduled today</p>
            <p className="text-gray-500 text-sm mt-2">Check back later!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredGames.map(game => (
              <GameCard
                key={game.id}
                game={game}
                onClick={() => handleSelectGame(game)}
              />
            ))}
          </div>
        )}
      </main>

      {/* PWA install hint for iOS */}
      <footer className="text-center py-4 text-xs text-gray-600">
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
