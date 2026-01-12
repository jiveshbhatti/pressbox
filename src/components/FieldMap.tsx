'use client';

import React from 'react';

interface FieldMapProps {
    yardLine?: number;
    possession?: string;
    homeTeamId: string;
    awayTeamId: string;
    awayColor: string;
    homeColor: string;
    sport: 'nfl' | 'nba';
}

export function FieldMap({
    yardLine,
    possession,
    homeTeamId,
    awayTeamId,
    awayColor,
    homeColor,
    sport
}: FieldMapProps) {
    if (sport !== 'nfl' || yardLine === undefined) return null;

    // yardLine from ESPN is 0-100 (relative to Home endzone 100)
    // 0 = Away Endzone, 100 = Home Endzone
    const ballPosPercent = yardLine;
    const possessionColor = possession === awayTeamId ? awayColor : (possession === homeTeamId ? homeColor : '#cbd5e1');

    return (
        <div className="w-full h-14 mt-4 relative overflow-hidden rounded-xl border border-white/20 shadow-inner group/field">
            {/* Field Background - Turf Green */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#2d5a27] to-[#1e3f1a] flex">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-black/5' : ''} border-r border-white/10 last:border-0`} />
                ))}
            </div>

            {/* Endzones */}
            <div className="absolute inset-y-0 left-0 w-[5%] bg-black/20 border-r border-white/40" style={{ backgroundColor: `${awayColor}40` }} />
            <div className="absolute inset-y-0 right-0 w-[5%] bg-black/20 border-l border-white/40" style={{ backgroundColor: `${homeColor}40` }} />

            {/* Yard Lines & Hash Marks */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Hash marks (simplified) */}
                <div className="absolute inset-x-0 top-0 h-1 flex justify-between px-0.5 opacity-40">
                    {[...Array(41)].map((_, i) => (
                        <div key={i} className="w-px h-full bg-white" />
                    ))}
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 flex justify-between px-0.5 opacity-40">
                    {[...Array(41)].map((_, i) => (
                        <div key={i} className="w-px h-full bg-white" />
                    ))}
                </div>
            </div>

            {/* 50 Yard Line (Main) */}
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/60 blur-[0.5px]" />

            {/* Ball Indicator (Broadcasting Style) */}
            <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-1000 ease-in-out z-20 flex flex-col items-center"
                style={{ left: `${ballPosPercent}%` }}
            >
                <div
                    className="w-4 h-4 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] border-2 border-white animate-pulse flex items-center justify-center p-0.5"
                    style={{ backgroundColor: possessionColor }}
                >
                    <div className="w-full h-full rounded-full bg-white/20" />
                </div>
                {/* Yard Line Ray */}
                <div className="w-px h-20 bg-gradient-to-b from-white to-transparent absolute top-4 opacity-50" />
            </div>

            {/* Yardage Markers (10 -> 50 -> 10) */}
            <div className="absolute inset-0 flex items-center pointer-events-none px-[10%] mb-1">
                {[10, 20, 30, 40, 50, 40, 30, 20, 10].map((num, i) => (
                    <div key={i} className="flex-1 flex justify-center items-center gap-0.5">
                        {/* Subtle arrow pointing to 50 */}
                        {i < 4 && <span className="text-[5px] text-white/40 mt-0.5">◀</span>}
                        <span className="text-[8px] font-black text-white/80 tabular-nums">
                            {num}
                        </span>
                        {i > 4 && <span className="text-[5px] text-white/40 mt-0.5">▶</span>}
                    </div>
                ))}
            </div>

            {/* Side Labels */}
            <div className="absolute inset-y-0 inset-x-0 flex justify-between items-end px-1.5 pb-0.5 pointer-events-none">
                <span className="text-[6px] font-black text-white/30 uppercase tracking-[0.2em]">{awayTeamId}</span>
                <span className="text-[6px] font-black text-white/30 uppercase tracking-[0.2em]">{homeTeamId}</span>
            </div>
        </div>
    );
}
