'use client';

import { GameThread } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

interface ThreadListProps {
  threads: GameThread[];
  selectedThreadId: string | null;
  onSelectThread: (thread: GameThread) => void;
  isLoading: boolean;
}

export function ThreadList({ threads, selectedThreadId, onSelectThread, isLoading }: ThreadListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-slate-800 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
            <div className="h-3 bg-slate-700 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No game threads found yet.</p>
        <p className="text-sm text-gray-500 mt-1">Threads usually appear 1-2 hours before game time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {threads.map(thread => (
        <button
          key={thread.post.id}
          onClick={() => onSelectThread(thread)}
          className={`w-full text-left p-4 rounded-lg border transition-all ${
            selectedThreadId === thread.post.id
              ? 'bg-orange-900/30 border-orange-600'
              : 'bg-slate-800 border-slate-700 hover:border-slate-600'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  thread.isMainThread
                    ? 'bg-blue-900/50 text-blue-400'
                    : 'bg-slate-700 text-gray-400'
                }`}>
                  r/{thread.subreddit}
                </span>
                {thread.isMainThread && (
                  <span className="text-xs text-orange-400">Main Thread</span>
                )}
              </div>
              <h3 className="font-medium text-sm line-clamp-2">{thread.post.title}</h3>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span>💬 {thread.post.num_comments.toLocaleString()}</span>
                <span>⬆️ {thread.post.score.toLocaleString()}</span>
                <span>{formatRelativeTime(thread.post.created_utc)}</span>
              </div>
            </div>
            <span className="text-gray-500">→</span>
          </div>
        </button>
      ))}
    </div>
  );
}
