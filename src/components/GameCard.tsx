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
        className="bg-slate-200 rounded-full flex items-center justify-center text-slate-600 text-xs font-black"
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

  // Team colors (fallback to neutral slate)
  const awayColor = game.awayTeam.color ? `#${game.awayTeam.color}` : '#64748b';
  const homeColor = game.homeTeam.color ? `#${game.homeTeam.color}` : '#475569';

  return (
    <button
      onClick={onClick}
      className="w-full h-full rounded-[40px] p-0.5 relative group transition-all duration-700 hover:scale-[1.03] active:scale-[0.98]"
    >
      {/* Diffuse Atmospheric Halos - More prominent team colors */}
      <div
        className="absolute inset-x-[-15%] inset-y-[-40%] opacity-35 transition-opacity duration-1000 group-hover:opacity-55"
        style={{
          background: `
            radial-gradient(circle at 0% 50%, ${awayColor} 0%, transparent 55%),
            radial-gradient(circle at 100% 50%, ${homeColor} 0%, transparent 55%)
          `,
          filter: 'blur(80px)',
        }}
      />

      {/* Main Glass Card container */}
      <div
        className="relative glass h-full w-full rounded-[38px] p-8 flex flex-col items-stretch overflow-visible transition-colors duration-500 shadow-2xl shadow-slate-300/60"
        style={{
          background: `linear-gradient(135deg, ${awayColor}30 0%, transparent 40%, transparent 60%, ${homeColor}30 100%), rgba(255, 255, 255, 0.65)`,
          borderColor: 'rgba(255, 255, 255, 0.9)',
        }}
      >
        {/* Side Tints - More prominent team colors */}
        <div className="absolute inset-x-0 inset-y-0 flex pointer-events-none rounded-[38px] overflow-hidden">
          <div className="w-1/2 h-full opacity-25" style={{ background: `linear-gradient(to right, ${awayColor}, transparent 70%)` }} />
          <div className="w-1/2 h-full opacity-25" style={{ background: `linear-gradient(to left, ${homeColor}, transparent 70%)` }} />
        </div>

        {/* Subtle Shine/Inner Glow */}
        <div className="absolute inset-0 rounded-[38px] bg-gradient-to-br from-white/70 to-transparent pointer-events-none" />

        {/* Top Label (Sport) */}
        <div className="flex justify-center mb-6 relative z-10">
          <span className="text-[9px] font-black tracking-[0.3em] uppercase px-4 py-1 rounded-full bg-slate-900/5 text-slate-500 border border-slate-900/10">
            {game.sport}
          </span>
        </div>

        {/* Main Scoreboard Row: Team - Score - Team */}
        <div className="flex items-center justify-between gap-2 mb-4 relative z-10">
          {/* Away Team */}
          <div className="flex flex-col items-center gap-3 w-[100px]">
            <div className="relative group/logo">
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-40 group-hover/logo:opacity-60 transition-opacity"
                style={{ backgroundColor: awayColor }}
              />
              <div
                className="relative bg-white/80 backdrop-blur-md p-2 rounded-2xl border-2 shadow-lg transition-transform group-hover:scale-110 duration-500"
                style={{ borderColor: `${awayColor}60` }}
              >
                <TeamLogo src={game.awayTeam.logo} alt={game.awayTeam.abbreviation} size={50} />
              </div>
              {/* Team color accent bar */}
              <div
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                style={{ backgroundColor: awayColor }}
              />
            </div>
            <div className="text-center">
              <div className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight">
                {game.awayTeam.name}
              </div>
              <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest italic">
                {game.awayTeam.abbreviation}
              </div>
            </div>
          </div>

          {/* Centered Score & Status */}
          <div className="flex flex-col items-center flex-1">
            {(isLive || isFinal) ? (
              <div className="flex items-center gap-6">
                <span className={`text-6xl font-black tabular-nums tracking-tighter text-slate-900`}>
                  {game.awayScore ?? '-'}
                </span>
                <span className="text-2xl font-black text-slate-300">—</span>
                <span className={`text-6xl font-black tabular-nums tracking-tighter text-slate-900`}>
                  {game.homeScore ?? '-'}
                </span>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Kickoff</div>
              </div>
            )}

            {/* Status Indicator */}
            <div className="mt-4">
              {isLive ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="flex items-center gap-2 text-[10px] font-black text-red-600 tracking-widest uppercase">
                    <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
                    {game.clock} {game.period}P
                  </span>
                </div>
              ) : isFinal ? (
                <span className="text-[10px] font-black text-slate-400 tracking-[0.4em] uppercase">Final</span>
              ) : (
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                  {formatDistanceToNow(game.startTime)}
                </span>
              )}
            </div>
          </div>

          {/* Home Team */}
          <div className="flex flex-col items-center gap-3 w-[100px]">
            <div className="relative group/logo">
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-40 group-hover/logo:opacity-60 transition-opacity"
                style={{ backgroundColor: homeColor }}
              />
              <div
                className="relative bg-white/80 backdrop-blur-md p-2 rounded-2xl border-2 shadow-lg transition-transform group-hover:scale-110 duration-500"
                style={{ borderColor: `${homeColor}60` }}
              >
                <TeamLogo src={game.homeTeam.logo} alt={game.homeTeam.abbreviation} size={50} />
              </div>
              {/* Team color accent bar */}
              <div
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                style={{ backgroundColor: homeColor }}
              />
            </div>
            <div className="text-center">
              <div className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight">
                {game.homeTeam.name}
              </div>
              <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest italic">
                {game.homeTeam.abbreviation}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Details (Odds / Venue) */}
        <div className="mt-6 flex justify-center gap-6 relative z-10">
          {game.situation?.odds?.spread && (
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-r border-slate-200 pr-6">
              {game.situation.odds.spread}
            </span>
          )}
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {game.venue || 'TBD'}
          </span>
        </div>
      </div>
    </button>
  );
}
