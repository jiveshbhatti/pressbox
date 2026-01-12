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
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass rounded-2xl p-5 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="h-4 w-12 bg-slate-100 dark:bg-slate-600 rounded-full" />
            </div>
            <div className="h-5 bg-slate-100 dark:bg-slate-700 rounded-lg w-4/5 mb-3" />
            <div className="h-4 bg-slate-50 dark:bg-slate-600 rounded-lg w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="text-center py-16 glass rounded-3xl">
        <div className="text-4xl mb-4">🏈</div>
        <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">No threads yet</p>
        <p className="text-slate-400 dark:text-slate-500 text-xs mt-2">Threads usually appear 1-2 hours before game time</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-4">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Discussions ({threads.length})
        </h2>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">Tap to open in Reddit</span>
      </div>

      {/* Thread Cards */}
      {threads.map(thread => {
        const isTrending = thread.post.num_comments > 500;
        const isHot = thread.post.num_comments > 2000;
        const threadType = getThreadType(thread.post.title);

        return (
          <a
            key={thread.post.id}
            href={getRedditUrl(thread)}
            target="_blank"
            rel="noopener noreferrer"
            className="block glass rounded-2xl p-4 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 group"
          >
            {/* Top Row: Badges */}
            <div className="flex items-center gap-2 mb-2">
              {/* Thread Type Badge */}
              <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${threadType.color}`}>
                {threadType.label}
              </span>

              {/* Subreddit */}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                thread.isMainThread
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
              }`}>
                r/{thread.subreddit}
              </span>

              {/* Hot indicator */}
              {isHot && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                  HOT
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-sm text-slate-800 dark:text-white leading-snug mb-3 line-clamp-2 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
              {thread.post.title}
            </h3>

            {/* Bottom Row: Stats */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Comments */}
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className={`text-xs font-bold ${isTrending ? 'text-orange-500' : 'text-slate-500 dark:text-slate-400'}`}>
                    {thread.post.num_comments.toLocaleString()}
                  </span>
                </div>

                {/* Score */}
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {thread.post.score.toLocaleString()}
                  </span>
                </div>

                {/* Time */}
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {formatRelativeTime(thread.post.created_utc)}
                </span>
              </div>

              {/* Arrow */}
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-slate-800 dark:group-hover:bg-white transition-colors">
                <svg className="w-4 h-4 text-slate-400 dark:text-slate-300 group-hover:text-white dark:group-hover:text-slate-800 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
