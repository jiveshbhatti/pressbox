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

  // Find game leaders for each team
  const homeLeader = game.leaders?.find(l => l.teamId === game.homeTeam.id);
  const awayLeader = game.leaders?.find(l => l.teamId === game.awayTeam.id);

  return (
    <button
      onClick={onClick}
      className={`w-full glass glass-hover rounded-2xl p-5 text-left relative overflow-hidden group ${game.sport === 'nfl' ? 'hover:border-blue-500/30' : 'hover:border-red-500/30'
        }`}
    >
      {/* Background accent */}
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20 ${game.sport === 'nfl' ? 'bg-blue-500' : 'bg-red-500'
        }`} />

      {/* Header: Sport & Status */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md border ${game.sport === 'nfl'
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
            {game.sport}
          </span>
          {game.situation?.odds?.spread && (
            <span className="text-[10px] font-medium text-gray-500 bg-slate-700/30 px-2 py-0.5 rounded-md">
              {game.situation.odds.spread}
            </span>
          )}
        </div>

        {isLive ? (
          <div className="flex flex-col items-end">
            <span className="flex items-center gap-1.5 text-xs font-bold text-red-500">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-live shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              LIVE
            </span>
            {game.statusDetail && (
              <span className="text-[10px] font-medium text-gray-400 mt-0.5 uppercase tracking-tighter">
                {game.statusDetail}
              </span>
            )}
          </div>
        ) : isFinal ? (
          <span className="text-[10px] font-black text-gray-500 tracking-wider">FINAL</span>
        ) : (
          <span className="text-[10px] font-bold text-gray-400 uppercase">
            {formatDistanceToNow(game.startTime)}
          </span>
        )}
      </div>

      {/* Teams & Scores */}
      <div className="space-y-4 relative z-10">
        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-1.5 bg-slate-900/50 rounded-xl border border-slate-700/50">
              <TeamLogo src={game.awayTeam.logo} alt={game.awayTeam.abbreviation} size={36} />
            </div>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                {game.awayTeam.name}
              </div>
              <div className="text-[10px] text-gray-500 font-medium">
                {game.awayTeam.record || '0-0'} • Away
              </div>
            </div>
          </div>
          {(isLive || isFinal) && (
            <div className="flex flex-col items-end">
              <span className={`text-3xl font-black tabular-nums tracking-tighter ${isFinal && game.awayScore! > game.homeScore! ? 'text-white' :
                  isLive && game.awayScore! > game.homeScore! ? 'text-blue-400' : 'text-gray-500'
                }`}>
                {game.awayScore ?? '-'}
              </span>
              {isLive && game.situation?.probability && (
                <span className="text-[9px] font-bold text-gray-600">
                  {Math.round(game.situation.probability.away!)}% WIN
                </span>
              )}
            </div>
          )}
        </div>

        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-1.5 bg-slate-900/50 rounded-xl border border-slate-700/50">
              <TeamLogo src={game.homeTeam.logo} alt={game.homeTeam.abbreviation} size={36} />
            </div>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                {game.homeTeam.name}
              </div>
              <div className="text-[10px] text-gray-500 font-medium">
                {game.homeTeam.record || '0-0'} • Home
              </div>
            </div>
          </div>
          {(isLive || isFinal) && (
            <div className="flex flex-col items-end">
              <span className={`text-3xl font-black tabular-nums tracking-tighter ${isFinal && game.homeScore! > game.awayScore! ? 'text-white' :
                  isLive && game.homeScore! > game.awayScore! ? 'text-blue-400' : 'text-gray-500'
                }`}>
                {game.homeScore ?? '-'}
              </span>
              {isLive && game.situation?.probability && (
                <span className="text-[9px] font-bold text-gray-600">
                  {Math.round(game.situation.probability.home!)}% WIN
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
        {isLive && game.situation?.downDistanceText ? (
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${game.situation.isRedZone ? 'bg-red-500' : 'bg-yellow-500'}`} />
            <p className={`text-[11px] font-black uppercase tracking-wider ${game.situation.isRedZone ? 'text-red-400' : 'text-yellow-400'}`}>
              {game.situation.downDistanceText}
            </p>
          </div>
        ) : (awayLeader || homeLeader) ? (
          <div className="flex gap-4 overflow-hidden">
            {[awayLeader, homeLeader].filter(Boolean).map((leader, i) => (
              <div key={i} className="flex flex-col min-w-0">
                <span className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter">Leader</span>
                <span className="text-[10px] font-medium text-gray-400 truncate max-w-[100px]">
                  {leader!.player.split(' ').pop()} • <span className="text-gray-500">{leader!.stat}</span>
                </span>
              </div>
            ))}
          </div>
        ) : game.venue ? (
          <p className="text-[10px] text-gray-500 font-medium truncate">📍 {game.venue}</p>
        ) : <div />}

        <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-600 group-hover:text-blue-500 transition-colors uppercase tracking-widest">
          Threads
          <span className="text-xs group-hover:translate-x-0.5 transition-transform">→</span>
        </div>
      </div>
    </button>
  );
}
