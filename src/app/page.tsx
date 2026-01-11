'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { GameCard } from '@/components/GameCard';
import { ThreadList } from '@/components/ThreadList';
import { Comments } from '@/components/Comments';
import { Game, GameThread, Sport } from '@/types';
import { getAllGames } from '@/lib/sports';
import { findGameThreads } from '@/lib/threads';
import { findGameThreadsPublic } from '@/lib/reddit-public';

function HomePage() {
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [threads, setThreads] = useState<GameThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<GameThread | null>(null);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [sportFilter, setSportFilter] = useState<Sport | 'all'>('all');

  // Fetch games on mount and every 5 minutes
  const fetchGames = useCallback(async () => {
    try {
      const allGames = await getAllGames();
      setGames(allGames);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setIsLoadingGames(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchGames]);

  // Fetch threads when a game is selected
  const handleSelectGame = useCallback(async (game: Game) => {
    setSelectedGame(game);
    setSelectedThread(null);
    setThreads([]);
    setIsLoadingThreads(true);

    try {
      // Use authenticated API if available, otherwise use public JSON
      const gameThreads = accessToken
        ? await findGameThreads(accessToken, game)
        : await findGameThreadsPublic(game);
      setThreads(gameThreads);
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setIsLoadingThreads(false);
    }
  }, [accessToken]);

  const handleBack = () => {
    if (selectedThread) {
      setSelectedThread(null);
    } else if (selectedGame) {
      setSelectedGame(null);
      setThreads([]);
    }
  };

  const filteredGames = sportFilter === 'all'
    ? games
    : games.filter(g => g.sport === sportFilter);

  // Show comments view
  if (selectedThread) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col">
          <Comments thread={selectedThread} onBack={handleBack} />
        </main>
      </div>
    );
  }

  // Show thread list for selected game
  if (selectedGame) {
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

          <div className="bg-slate-800 rounded-xl p-4 mb-4 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                selectedGame.sport === 'nfl'
                  ? 'bg-green-900/50 text-green-400'
                  : 'bg-orange-900/50 text-orange-400'
              }`}>
                {selectedGame.sport}
              </span>
              {selectedGame.status === 'in_progress' && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-red-400">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold">
              {selectedGame.awayTeam.name} @ {selectedGame.homeTeam.name}
            </h2>
            {(selectedGame.status === 'in_progress' || selectedGame.status === 'final') && (
              <p className="text-2xl font-bold mt-1">
                {selectedGame.awayScore} - {selectedGame.homeScore}
              </p>
            )}
          </div>

          {!isAuthenticated && (
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 mb-4 text-sm">
              <p className="text-blue-300">📖 Read-only mode • Sign in with Reddit to comment & vote</p>
            </div>
          )}

          <ThreadList
            threads={threads}
            selectedThreadId={null}
            onSelectThread={setSelectedThread}
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
        {isLoadingGames || authLoading ? (
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
