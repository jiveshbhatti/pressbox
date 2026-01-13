'use client';

import { Game } from '@/types';
import { formatGameTime } from '@/lib/utils';
import Image from 'next/image';

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ?
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
    '100, 116, 139';
}

interface GameCardProps {
  game: Game;
  onClick: () => void;
  onToggleFavorite?: (teamAbbr: string) => void;
  isAwayFavorite?: boolean;
  isHomeFavorite?: boolean;
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

export function GameCard({
  game,
  onClick,
  onToggleFavorite,
  isAwayFavorite,
  isHomeFavorite
}: GameCardProps) {
  const isLive = game.status === 'in_progress';
  const isFinal = game.status === 'final';

  // Team colors (fallback to neutral slate)
  const awayColor = game.awayTeam.color ? `#${game.awayTeam.color}` : '#64748b';
  const homeColor = game.homeTeam.color ? `#${game.homeTeam.color}` : '#475569';

  return (
    <button
      onClick={onClick}
      className="w-full h-full rounded-[28px] sm:rounded-[40px] p-0.5 relative group transition-all duration-700 hover:scale-[1.03] active:scale-[0.98]"
    >
      {/* Diffuse Atmospheric Halos - VERY prominent team colors */}
      <div
        className="absolute inset-x-[-10%] inset-y-[-30%] opacity-70 transition-opacity duration-1000 group-hover:opacity-90"
        style={{
          background: `
            radial-gradient(circle at 0% 50%, ${awayColor} 0%, transparent 40%),
            radial-gradient(circle at 100% 50%, ${homeColor} 0%, transparent 40%)
          `,
          filter: 'blur(35px)',
        }}
      />

      {/* Main Glass Card container - more transparent */}
      <div
        className="relative h-full w-full rounded-[28px] sm:rounded-[38px] p-4 sm:p-8 flex flex-col items-stretch overflow-hidden transition-colors duration-500 shadow-2xl shadow-slate-400/40 dark:shadow-black/40"
        style={{
          background: `linear-gradient(135deg, ${awayColor}70 0%, rgba(255,255,255,0.25) 25%, rgba(255,255,255,0.25) 75%, ${homeColor}70 100%)`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
        }}
      >
        {/* Side Tints - Strong team color washes */}
        <div className="absolute inset-0 flex pointer-events-none rounded-[28px] sm:rounded-[38px] overflow-hidden">
          <div className="w-1/2 h-full opacity-40" style={{ background: `linear-gradient(to right, ${awayColor}, transparent 60%)` }} />
          <div className="w-1/2 h-full opacity-40" style={{ background: `linear-gradient(to left, ${homeColor}, transparent 60%)` }} />
        </div>

        {/* Subtle Shine/Inner Glow - reduced */}
        <div className="absolute inset-0 rounded-[28px] sm:rounded-[38px] bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />

        {/* Top Label (Sport) */}
        <div className="flex justify-center mb-3 sm:mb-6 relative z-10">
          <span className="text-[8px] sm:text-[9px] font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase px-3 sm:px-4 py-0.5 sm:py-1 rounded-full bg-slate-900/5 text-slate-500 border border-slate-900/10">
            {game.sport}
          </span>
        </div>

        {/* Main Scoreboard Row: Team - Score - Team */}
        <div className="flex items-center justify-between gap-1 sm:gap-2 mb-4 relative z-10">
          {/* Away Team */}
          <div className="flex flex-col items-center gap-2 sm:gap-3 w-[70px] sm:w-[100px]">
            <div className="relative group/logo">
              <div
                className="absolute inset-x-0 inset-y-0 rounded-full blur-2xl opacity-0 group-hover/logo:opacity-50 transition-opacity"
                style={{ backgroundColor: awayColor }}
              />
              {/* Possession Glow */}
              {game.situation?.possession === game.awayTeam.id && (
                <div
                  className="absolute inset-[-12px] rounded-full blur-xl possession-glow z-0"
                  style={{ '--possession-color': awayColor.startsWith('#') ? hexToRgb(awayColor) : '100, 116, 139' } as any}
                />
              )}
              <div className="relative bg-white/80 backdrop-blur-md p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-white shadow-md transition-transform group-hover:scale-110 duration-500 z-10">
                <TeamLogo src={game.awayTeam.logo} alt={game.awayTeam.abbreviation} size={36} />

                {/* Favorite Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite?.(game.awayTeam.abbreviation);
                  }}
                  className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center border shadow-sm transition-all ${isAwayFavorite
                    ? 'bg-yellow-400 border-yellow-500 text-white scale-110 opacity-100'
                    : 'bg-white border-slate-100 text-slate-300 opacity-0 group-hover/logo:opacity-100'
                    }`}
                >
                  <span className="text-[10px]">{isAwayFavorite ? '★' : '☆'}</span>
                </button>
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] sm:text-sm font-black text-slate-900 uppercase tracking-tight leading-tight">
                {game.awayTeam.name}
              </div>
              <div className="text-[8px] sm:text-[10px] text-slate-500 font-bold mt-0.5 sm:mt-1 uppercase tracking-widest italic">
                {game.awayTeam.abbreviation}
              </div>
            </div>
          </div>

          {/* Centered Score & Status */}
          <div className="flex flex-col items-center flex-1">
            {(isLive || isFinal) ? (
              <div className="flex items-center gap-3 sm:gap-6">
                <span className={`text-4xl sm:text-6xl font-black tabular-nums tracking-tighter text-slate-900`}>
                  {game.awayScore ?? '-'}
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-300">—</span>
                <span className={`text-4xl sm:text-6xl font-black tabular-nums tracking-tighter text-slate-900`}>
                  {game.homeScore ?? '-'}
                </span>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                  {formatGameTime(game.startTime)}
                </div>
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
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {game.sport.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Home Team */}
          <div className="flex flex-col items-center gap-2 sm:gap-3 w-[70px] sm:w-[100px]">
            <div className="relative group/logo">
              <div
                className="absolute inset-x-0 inset-y-0 rounded-full blur-2xl opacity-0 group-hover/logo:opacity-50 transition-opacity"
                style={{ backgroundColor: homeColor }}
              />
              {/* Possession Glow */}
              {game.situation?.possession === game.homeTeam.id && (
                <div
                  className="absolute inset-[-12px] rounded-full blur-xl possession-glow z-0"
                  style={{ '--possession-color': homeColor.startsWith('#') ? hexToRgb(homeColor) : '71, 85, 105' } as any}
                />
              )}
              <div
                className="relative bg-white/80 backdrop-blur-md p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border shadow-md transition-transform group-hover:scale-110 duration-500 z-10"
                style={{ borderColor: `${homeColor}60` }}
              >
                <TeamLogo src={game.homeTeam.logo} alt={game.homeTeam.abbreviation} size={36} />

                {/* Favorite Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite?.(game.homeTeam.abbreviation);
                  }}
                  className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center border shadow-sm transition-all ${isHomeFavorite
                    ? 'bg-yellow-400 border-yellow-500 text-white scale-110 opacity-100'
                    : 'bg-white border-slate-100 text-slate-300 opacity-0 group-hover/logo:opacity-100'
                    }`}
                >
                  <span className="text-[10px]">{isHomeFavorite ? '★' : '☆'}</span>
                </button>
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] sm:text-sm font-black text-slate-900 uppercase tracking-tight leading-tight">
                {game.homeTeam.name}
              </div>
              <div className="text-[8px] sm:text-[10px] text-slate-500 font-bold mt-0.5 sm:mt-1 uppercase tracking-widest italic">
                {game.homeTeam.abbreviation}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Details (Odds / Venue) */}
        <div className="mt-3 sm:mt-6 flex justify-center gap-3 sm:gap-6 relative z-10">
          {game.situation?.odds?.spread && (
            <span className="text-[8px] sm:text-[10px] font-black text-slate-900 uppercase tracking-wider sm:tracking-widest border-r border-slate-200 pr-3 sm:pr-6">
              {game.situation.odds.spread}
            </span>
          )}
          <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider sm:tracking-widest truncate max-w-[100px] sm:max-w-none">
            {game.venue || 'TBD'}
          </span>
        </div>
      </div>
    </button>
  );
}
