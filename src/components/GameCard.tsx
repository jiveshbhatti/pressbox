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

  // Team colors (defaults to slate if not provided)
  const awayColor = game.awayTeam.color ? `#${game.awayTeam.color}` : '#334155';
  const homeColor = game.homeTeam.color ? `#${game.homeTeam.color}` : '#1e293b';

  return (
    <button
      onClick={onClick}
      className="w-full h-full rounded-2xl p-[1px] relative overflow-hidden group transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: `linear-gradient(135deg, ${awayColor}44 0%, ${homeColor}44 100%)`,
      }}
    >
      {/* Background Split Team Colors */}
      <div
        className="absolute inset-0 opacity-40 transition-opacity group-hover:opacity-60"
        style={{
          background: `linear-gradient(to right, ${awayColor} 0%, ${awayColor} 50%, ${homeColor} 50%, ${homeColor} 100%)`,
        }}
      />

      {/* Glass Inner Layer */}
      <div className="relative glass h-full w-full rounded-[15px] p-5 flex flex-col justify-between overflow-hidden">
        {/* Subtle radial glow based on team with possession or live status */}
        <div className={`absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 rounded-full blur-[60px] opacity-20 transition-all ${isLive ? 'bg-white scale-110' : 'bg-transparent'
          }`} />

        <div className="relative z-10">
          {/* Header: Sport & Status */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold tracking-tighter uppercase px-2 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/5">
                {game.sport}
              </span>
              {game.situation?.odds?.spread && (
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  {game.situation.odds.spread}
                </span>
              )}
            </div>

            {isLive ? (
              <div className="flex flex-col items-end">
                <span className="flex items-center gap-1.5 text-xs font-black text-red-500">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-live" />
                  LIVE
                </span>
                <span className="text-[10px] font-black text-white/40 mt-0.5 uppercase">
                  {game.clock} • Q{game.period}
                </span>
              </div>
            ) : isFinal ? (
              <span className="text-[10px] font-black text-white/30 tracking-widest uppercase">Final</span>
            ) : (
              <span className="text-[10px] font-black text-white/40 uppercase">
                {formatDistanceToNow(game.startTime)}
              </span>
            )}
          </div>

          {/* Teams & Scores */}
          <div className="space-y-6">
            {/* Away Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <TeamLogo src={game.awayTeam.logo} alt={game.awayTeam.abbreviation} size={42} />
                  {game.situation?.possession === game.awayTeam.abbreviation && (
                    <div className="absolute -right-1 -top-1 w-3 h-3 bg-white rounded-full border-2 border-slate-900" />
                  )}
                </div>
                <div>
                  <div className="text-lg font-black text-white leading-none tracking-tight uppercase">
                    {game.awayTeam.name}
                  </div>
                  <div className="text-[10px] text-white/40 font-bold mt-1 uppercase tracking-tighter">
                    {game.awayTeam.record || '0-0'}
                  </div>
                </div>
              </div>
              {(isLive || isFinal) && (
                <span className={`text-4xl font-black tabular-nums tracking-tighter ${isFinal && game.awayScore! > game.homeScore! ? 'text-white' :
                    isLive ? 'text-white' : 'text-white/30'
                  }`}>
                  {game.awayScore ?? '-'}
                </span>
              )}
            </div>

            {/* Home Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <TeamLogo src={game.homeTeam.logo} alt={game.homeTeam.abbreviation} size={42} />
                  {game.situation?.possession === game.homeTeam.abbreviation && (
                    <div className="absolute -right-1 -top-1 w-3 h-3 bg-white rounded-full border-2 border-slate-900" />
                  )}
                </div>
                <div>
                  <div className="text-lg font-black text-white leading-none tracking-tight uppercase">
                    {game.homeTeam.name}
                  </div>
                  <div className="text-[10px] text-white/40 font-bold mt-1 uppercase tracking-tighter">
                    {game.homeTeam.record || '0-0'}
                  </div>
                </div>
              </div>
              {(isLive || isFinal) && (
                <span className={`text-4xl font-black tabular-nums tracking-tighter ${isFinal && game.homeScore! > game.awayScore! ? 'text-white' :
                    isLive ? 'text-white' : 'text-white/30'
                  }`}>
                  {game.homeScore ?? '-'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between relative z-10">
          {isLive && game.situation?.downDistanceText ? (
            <p className={`text-[11px] font-black uppercase tracking-widest ${game.situation.isRedZone ? 'text-red-400' : 'text-yellow-400'}`}>
              {game.situation.downDistanceText}
            </p>
          ) : (awayLeader || homeLeader) ? (
            <div className="flex gap-4">
              {[awayLeader, homeLeader].filter(Boolean).map((leader, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-[8px] font-black text-white/30 uppercase">Leader</span>
                  <span className="text-[10px] font-bold text-white/60 uppercase">
                    {leader!.player.split(' ').pop()} {leader!.stat}
                  </span>
                </div>
              ))}
            </div>
          ) : game.venue ? (
            <p className="text-[10px] text-white/30 font-bold uppercase truncate max-w-[150px]">
              {game.venue}
            </p>
          ) : <div />}

          <div className="flex items-center gap-1.5 text-[10px] font-black text-white/50 group-hover:text-white transition-colors uppercase tracking-widest">
            Threads
            <span className="text-xs group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>
      </div>
    </button>
  );
}
