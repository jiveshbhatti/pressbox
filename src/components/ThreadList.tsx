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
          <div key={i} className="glass rounded-2xl p-6 animate-pulse">
            <div className="h-5 bg-slate-100 rounded-lg w-3/4 mb-4" />
            <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="text-center py-20 glass rounded-3xl border-dashed border-slate-200">
        <div className="text-5xl mb-6">🏝️</div>
        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Quiet on the front</p>
        <p className="text-[10px] text-slate-300 mt-3 uppercase font-bold">Threads usually appear 1-2 hours before kickoff</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2 mb-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Live Discussions</h2>
        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Tap to join Reddit</span>
      </div>

      {threads.map(thread => {
        const isTrending = thread.post.num_comments > 1000;

        return (
          <a
            key={thread.post.id}
            href={getRedditUrl(thread)}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full glass glass-hover rounded-2xl p-6 relative overflow-hidden group transition-all duration-300"
          >
            <div className="flex items-start justify-between gap-6 relative z-10">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border transition-colors ${thread.isMainThread
                    ? 'bg-slate-900 text-white border-transparent'
                    : 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                    r/{thread.subreddit}
                  </span>
                  {isTrending && (
                    <span className="flex items-center gap-1.5 text-[9px] font-black text-orange-500 uppercase tracking-widest italic">
                      <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
                      Hot
                    </span>
                  )}
                </div>
                <h3 className="font-extrabold text-base leading-tight text-slate-900 group-hover:text-slate-600 transition-colors tracking-tight">
                  {thread.post.title}
                </h3>
                <div className="flex items-center gap-5 mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="opacity-80">💬</span> {thread.post.num_comments.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="opacity-80">🔥</span> {thread.post.score.toLocaleString()}
                  </span>
                  <span className="text-slate-200">{formatRelativeTime(thread.post.created_utc)}</span>
                </div>
              </div>
              <div className="h-full flex items-center">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 group-hover:border-transparent transition-all duration-500">
                  <span className="text-slate-300 text-lg group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">↗</span>
                </div>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
