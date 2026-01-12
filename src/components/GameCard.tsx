'use client';

import { Game } from '@/types';
import { formatDistanceToNow } from '@/lib/utils';
import Image from 'next/image';

interface GameCardProps {
  game: Game;
  onClick: () => void;
}

function TeamLogo({ src, alt, size = 40 }: { src?: string; alt: string; size?: number }) {
  if (!src) {
    return (
      <div
        className="bg-slate-700 rounded-full flex items-center justify-center text-gray-400 text-xs font-bold"
        style={{ width: size, height: size }}
      >
        {alt.substring(0, 2)}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="object-contain"
      unoptimized // ESPN images don't need optimization
    />
  );
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
          <div className="flex flex-col items-end">
            <span className="flex items-center gap-1.5 text-xs font-medium text-red-400">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              LIVE
            </span>
            {game.statusDetail && (
              <span className="text-xs text-gray-400 mt-0.5">{game.statusDetail}</span>
            )}
          </div>
        ) : isFinal ? (
          <span className="text-xs font-medium text-gray-500">FINAL</span>
        ) : (
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(game.startTime)}
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="space-y-3">
        {/* Away team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TeamLogo src={game.awayTeam.logo} alt={game.awayTeam.abbreviation} />
            <div>
              <div className="font-semibold">{game.awayTeam.name}</div>
              <div className="text-xs text-gray-500">
                {game.awayTeam.record && <span>{game.awayTeam.record}</span>}
              </div>
            </div>
          </div>
          {(isLive || isFinal) && (
            <span className={`text-2xl font-bold tabular-nums ${
              isFinal && game.awayScore! > game.homeScore! ? 'text-white' :
              isLive && game.awayScore! > game.homeScore! ? 'text-green-400' : 'text-gray-400'
            }`}>
              {game.awayScore ?? '-'}
            </span>
          )}
        </div>

        {/* Home team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TeamLogo src={game.homeTeam.logo} alt={game.homeTeam.abbreviation} />
            <div>
              <div className="font-semibold">{game.homeTeam.name}</div>
              <div className="text-xs text-gray-500">
                {game.homeTeam.record && <span>{game.homeTeam.record} • </span>}
                <span>Home</span>
              </div>
            </div>
          </div>
          {(isLive || isFinal) && (
            <span className={`text-2xl font-bold tabular-nums ${
              isFinal && game.homeScore! > game.awayScore! ? 'text-white' :
              isLive && game.homeScore! > game.awayScore! ? 'text-green-400' : 'text-gray-400'
            }`}>
              {game.homeScore ?? '-'}
            </span>
          )}
        </div>
      </div>

      {/* Live game situation (NFL down & distance) */}
      {isLive && game.situation?.downDistanceText && (
        <div className={`mt-3 pt-2 border-t border-slate-700 ${game.situation.isRedZone ? 'text-red-400' : 'text-yellow-400'}`}>
          <p className="text-xs font-medium">
            🏈 {game.situation.downDistanceText}
            {game.situation.isRedZone && ' 🔴'}
          </p>
        </div>
      )}

      {/* Venue for scheduled games */}
      {game.status === 'scheduled' && game.venue && (
        <div className="mt-3 pt-2 border-t border-slate-700">
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
