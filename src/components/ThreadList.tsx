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

export function ThreadList({ threads, isLoading }: ThreadListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass rounded-xl p-5 animate-pulse">
            <div className="h-4 bg-slate-700/50 rounded w-3/4 mb-3" />
            <div className="h-3 bg-slate-700/50 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="text-center py-16 glass rounded-2xl border-dashed border-slate-700/50">
        <div className="text-4xl mb-4">🏠</div>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No game threads found</p>
        <p className="text-[10px] text-gray-500 mt-2 uppercase">Threads usually appear 1-2 hours before kickoff</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Live Discussions</h2>
        <span className="text-[10px] font-medium text-gray-600 uppercase tracking-tighter">Tap to open in app</span>
      </div>

      {threads.map(thread => {
        const isTrending = thread.post.num_comments > 1000;

        return (
          <a
            key={thread.post.id}
            href={getRedditUrl(thread)}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full glass glass-hover rounded-xl p-5 relative overflow-hidden group"
          >
            <div className="flex items-start justify-between gap-4 relative z-10">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${thread.isMainThread
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-slate-700/50 text-gray-400'
                    }`}>
                    r/{thread.subreddit}
                  </span>
                  {isTrending && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-orange-500 uppercase italic tracking-tighter">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                      Trending
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-sm leading-snug group-hover:text-blue-400 transition-colors">{thread.post.title}</h3>
                <div className="flex items-center gap-4 mt-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  <span className="flex items-center gap-1 text-blue-400/80">
                    <span className="opacity-70">💬</span> {thread.post.num_comments.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="opacity-70">⬆️</span> {thread.post.score.toLocaleString()}
                  </span>
                  <span className="text-gray-600">{formatRelativeTime(thread.post.created_utc)}</span>
                </div>
              </div>
              <div className="h-full flex items-center">
                <span className="text-gray-600 text-xl group-hover:text-blue-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300">↗</span>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
