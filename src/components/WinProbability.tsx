'use client';

import React from 'react';

interface WinProbabilityProps {
    homeProb?: number;
    awayProb?: number;
    homeColor: string;
    awayColor: string;
    homeAbbr: string;
    awayAbbr: string;
}

export function WinProbability({
    homeProb,
    awayProb,
    homeColor,
    awayColor,
    homeAbbr,
    awayAbbr
}: WinProbabilityProps) {
    // ESPN usually gives probabilities as 0.0 to 1.0
    const homePercent = homeProb ? Math.round(homeProb * 100) : 50;
    const awayPercent = awayProb ? Math.round(awayProb * 100) : 50;

    // If no data, don't show or show balanced
    if (homeProb === undefined && awayProb === undefined) return null;

    return (
        <div className="w-full mt-6 px-2 group/prob">
            <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest group-hover/prob:text-slate-900 dark:group-hover/prob:text-white transition-colors">
                    Win Probability
                </span>
            </div>

            <div className="relative h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-900/5 dark:border-white/10 flex shadow-inner">
                {/* Away Part */}
                <div
                    className="h-full transition-all duration-1000 ease-in-out relative group/away"
                    style={{
                        width: `${awayPercent}%`,
                        backgroundColor: awayColor,
                        boxShadow: `inset -10px 0 20px -10px rgba(0,0,0,0.3)`
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                </div>

                {/* Home Part */}
                <div
                    className="h-full transition-all duration-1000 ease-in-out relative group/home"
                    style={{
                        width: `${homePercent}%`,
                        backgroundColor: homeColor,
                        boxShadow: `inset 10px 0 20px -10px rgba(0,0,0,0.3)`
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-l from-white/20 to-transparent" />
                </div>

                {/* Center Line */}
                <div className="absolute inset-y-0 left-1/2 w-px bg-white/40 z-10" />
            </div>

            <div className="flex justify-between items-center mt-2 px-1">
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black tabular-nums" style={{ color: awayColor }}>{awayPercent}%</span>
                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">{awayAbbr}</span>
                </div>
                <div className="flex items-center gap-1.5 text-right">
                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">{homeAbbr}</span>
                    <span className="text-[10px] font-black tabular-nums" style={{ color: homeColor }}>{homePercent}%</span>
                </div>
            </div>
        </div>
    );
}
