'use client';

import { Game } from '@/types';
import { formatDistanceToNow } from '@/lib/utils';

interface GameCardProps {
  game: Game;
  onClick: () => void;
}

export function GameCard({ game, onClick }: GameCardProps) {
  const isLive = game.status === 'in_progress';
  const isFinal = game.status === 'final';

  return (
    <button
      onClick={onClick}
      className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl p-4 transition-all hover:border-slate-600 hover:shadow-lg text-left"
    >
      {/* Sport badge and status */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
          game.sport === 'nfl'
            ? 'bg-green-900/50 text-green-400'
            : 'bg-orange-900/50 text-orange-400'
        }`}>
          {game.sport}
        </span>

        {isLive ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-red-400">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            LIVE
          </span>
        ) : isFinal ? (
          <span className="text-xs font-medium text-gray-500">FINAL</span>
        ) : (
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(game.startTime)}
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="space-y-2">
        {/* Away team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl w-8 text-center">
              {game.sport === 'nfl' ? '🏈' : '🏀'}
            </span>
            <div>
              <div className="font-semibold">{game.awayTeam.name}</div>
              <div className="text-xs text-gray-500">{game.awayTeam.abbreviation}</div>
            </div>
          </div>
          {(isLive || isFinal) && (
            <span className={`text-2xl font-bold tabular-nums ${
              isFinal && game.awayScore! > game.homeScore! ? 'text-white' : 'text-gray-400'
            }`}>
              {game.awayScore ?? '-'}
            </span>
          )}
        </div>

        {/* Home team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl w-8 text-center">
              {game.sport === 'nfl' ? '🏈' : '🏀'}
            </span>
            <div>
              <div className="font-semibold">{game.homeTeam.name}</div>
              <div className="text-xs text-gray-500">{game.homeTeam.abbreviation} • Home</div>
            </div>
          </div>
          {(isLive || isFinal) && (
            <span className={`text-2xl font-bold tabular-nums ${
              isFinal && game.homeScore! > game.awayScore! ? 'text-white' : 'text-gray-400'
            }`}>
              {game.homeScore ?? '-'}
            </span>
          )}
        </div>
      </div>

      {/* Venue */}
      {game.venue && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <p className="text-xs text-gray-500 truncate">📍 {game.venue}</p>
        </div>
      )}

      {/* Tap hint */}
      <div className="mt-3 flex items-center justify-center">
        <span className="text-xs text-gray-500">Tap to view game threads →</span>
      </div>
    </button>
  );
}
