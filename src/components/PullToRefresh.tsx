'use client';

import { useState, useRef, useCallback, ReactNode } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  isRefreshing?: boolean;
}

export function PullToRefresh({ onRefresh, children, isRefreshing = false }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const THRESHOLD = 80; // Distance needed to trigger refresh
  const MAX_PULL = 120; // Maximum pull distance

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only enable pull-to-refresh when scrolled to top
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0) {
      // Apply resistance - pull gets harder as you go
      const resistance = 0.4;
      const distance = Math.min(diff * resistance, MAX_PULL);
      setPullDistance(distance);
    }
  }, [isPulling, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    if (pullDistance >= THRESHOLD && !isRefreshing) {
      // Trigger refresh
      await onRefresh();
    }

    // Reset
    setPullDistance(0);
    setIsPulling(false);
  }, [isPulling, pullDistance, isRefreshing, onRefresh]);

  const isTriggered = pullDistance >= THRESHOLD;

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex justify-center items-center transition-opacity duration-200 pointer-events-none z-10"
        style={{
          top: -50,
          height: 50,
          transform: `translateY(${pullDistance}px)`,
          opacity: pullDistance > 10 ? 1 : 0,
        }}
      >
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${isTriggered || isRefreshing ? 'bg-slate-800 dark:bg-white' : 'bg-slate-200 dark:bg-slate-700'} transition-colors`}>
          <svg
            className={`w-4 h-4 ${isTriggered || isRefreshing ? 'text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-400'} ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              transform: isRefreshing ? 'none' : `rotate(${Math.min(pullDistance / THRESHOLD * 180, 180)}deg)`,
              transition: isRefreshing ? 'none' : 'transform 0.1s ease-out',
            }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isTriggered || isRefreshing ? 'text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-400'}`}>
            {isRefreshing ? 'Refreshing...' : isTriggered ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Content with pull transform */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
