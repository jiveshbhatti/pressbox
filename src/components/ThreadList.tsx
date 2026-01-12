'use client';

import { GameThread } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

interface ThreadListProps {
  threads: GameThread[];
  selectedThreadId: string | null;
  onSelectThread: (thread: GameThread) => void;
  isLoading: boolean;
}

// Get Reddit URL that opens in the Reddit app on mobile
function getRedditUrl(thread: GameThread): string {
  const permalink = thread.post.permalink.startsWith('/')
    ? thread.post.permalink
    : `/${thread.post.permalink}`;
  return `https://reddit.com${permalink}`;
}

// Determine thread type from title
function getThreadType(title: string): { label: string; color: string } {
  const lower = title.toLowerCase();
  if (lower.includes('post game') || lower.includes('postgame')) {
    return { label: 'Post Game', color: 'bg-emerald-500' };
  }
  if (lower.includes('game thread') || lower.includes('gamethread')) {
    return { label: 'Live', color: 'bg-red-500' };
  }
  if (lower.includes('daily discussion') || lower.includes('index')) {
    return { label: 'Daily', color: 'bg-blue-500' };
  }
  return { label: 'Discussion', color: 'bg-slate-500' };
}

export function ThreadList({ threads, isLoading }: ThreadListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass rounded-[32px] p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-4 w-20 bg-slate-200/50 dark:bg-slate-700/50 rounded-full" />
              <div className="h-4 w-16 bg-slate-100/50 dark:bg-slate-700/30 rounded-full" />
            </div>
            <div className="h-6 bg-slate-200/50 dark:bg-slate-700/50 rounded-xl w-full mb-4" />
            <div className="h-4 bg-slate-100/50 dark:bg-slate-700/30 rounded-lg w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="text-center py-20 glass rounded-[40px] border-dashed border-2 border-slate-200 dark:border-slate-800">
        <div className="text-5xl mb-6 grayscale opacity-50">🏟️</div>
        <p className="text-slate-900 dark:text-white font-black text-lg uppercase tracking-tight">Quiet in the stands</p>
        <p className="text-slate-400 dark:text-slate-500 text-xs mt-2 uppercase tracking-widest font-bold">Threads usually appear closer to kickoff</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.4em]">
            Field Discussions
          </h2>
          <span className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {threads.length}
          </span>
        </div>
      </div>

      {/* Thread Cards */}
      <div className="grid grid-cols-1 gap-4">
        {threads.map(thread => {
          const isHot = thread.post.num_comments > 1000;
          const threadType = getThreadType(thread.post.title);

          return (
            <a
              key={thread.post.id}
              href={getRedditUrl(thread)}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block"
            >
              {/* Card Container */}
              <div className="glass rounded-[32px] p-6 transition-all duration-500 group-hover:shadow-[0_40px_80px_-20px_rgba(15,23,42,0.15)] group-hover:-translate-y-1 group-active:scale-[0.98] border border-white/40 dark:border-white/5 relative overflow-hidden">
                {/* Subtle highlight gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Top Row: Info Pills */}
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-2">
                    {/* Thread Type Glass Pill */}
                    <div className="glass-pill px-3 py-1 flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${threadType.color} shadow-[0_0_8px_rgba(0,0,0,0.2)]`} />
                      <span className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        {threadType.label}
                      </span>
                    </div>

                    {/* Subreddit Pill */}
                    <div className={`glass-pill px-3 py-1 ${thread.isMainThread
                        ? 'bg-slate-900 dark:bg-white border-none shadow-md'
                        : ''
                      }`}>
                      <span className={`text-[9px] font-black uppercase tracking-wider ${thread.isMainThread
                          ? 'text-white dark:text-slate-900'
                          : 'text-slate-400 dark:text-slate-500'
                        }`}>
                        r/{thread.subreddit}
                      </span>
                    </div>
                  </div>

                  {/* Hot Indicator */}
                  {isHot && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest animate-pulse">Hot 🔥</span>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-black text-base text-slate-900 dark:text-white leading-[1.3] mb-6 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors line-clamp-2 relative z-10">
                  {thread.post.title}
                </h3>

                {/* Bottom Row: Metrics & Actions */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-5">
                    {/* Comments */}
                    <div className="flex items-center gap-1.5 group/stat">
                      <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center transition-colors group-hover/stat:bg-blue-50 dark:group-hover/stat:bg-blue-900/20">
                        <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover/stat:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <span className="text-[11px] font-black text-slate-900 dark:text-white tabular-nums">
                        {thread.post.num_comments.toLocaleString()}
                      </span>
                    </div>

                    {/* Upvotes */}
                    <div className="flex items-center gap-1.5 group/stat">
                      <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center transition-colors group-hover/stat:bg-orange-50 dark:group-hover/stat:bg-orange-900/20">
                        <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover/stat:text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                        </svg>
                      </div>
                      <span className="text-[11px] font-black text-slate-900 dark:text-white tabular-nums">
                        {thread.post.score.toLocaleString()}
                      </span>
                    </div>

                    {/* Time */}
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/30 px-3 py-1.5 rounded-full">
                      {formatRelativeTime(thread.post.created_utc)}
                    </div>
                  </div>

                  {/* Open Arrow */}
                  <div className="w-10 h-10 rounded-[18px] bg-slate-900 dark:bg-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                    <svg className="w-4 h-4 text-white dark:text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
