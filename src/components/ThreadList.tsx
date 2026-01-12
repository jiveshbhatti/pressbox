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
      <p className="text-xs text-gray-500 mb-3">
        Tap a thread to open in Reddit app
      </p>
      {threads.map(thread => (
        <a
          key={thread.post.id}
          href={getRedditUrl(thread)}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-left p-4 rounded-lg border bg-slate-800 border-slate-700 hover:border-slate-600 hover:bg-slate-750 transition-all"
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
            <span className="text-orange-400 text-lg">↗</span>
          </div>
        </a>
      ))}
    </div>
  );
}
