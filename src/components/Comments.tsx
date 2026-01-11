'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RedditComment, GameThread } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getPostComments, postComment, vote } from '@/lib/reddit';
import { getPostCommentsPublic } from '@/lib/reddit-public';
import { formatRelativeTime, cn } from '@/lib/utils';

interface CommentsProps {
  thread: GameThread;
  onBack: () => void;
}

export function Comments({ thread, onBack }: CommentsProps) {
  const { accessToken, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<RedditComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [newCommentText, setNewCommentText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [sortBy, setSortBy] = useState<'new' | 'best' | 'top'>('new');
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const lastCommentId = useRef<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      let newComments: RedditComment[];

      if (accessToken) {
        // Use authenticated API
        const data = await getPostComments(
          accessToken,
          thread.subreddit,
          thread.post.id,
          sortBy
        );
        newComments = data[1].data.children
          .filter(c => c.data && c.data.body)
          .map(c => c.data);
      } else {
        // Use public JSON API
        const { comments } = await getPostCommentsPublic(
          thread.subreddit,
          thread.post.id,
          sortBy
        );
        newComments = comments;
      }

      // Check if we have new comments
      const latestId = newComments[0]?.id;
      const hasNewComments = latestId && latestId !== lastCommentId.current;

      setComments(newComments);

      if (hasNewComments && lastCommentId.current !== null && sortBy === 'new') {
        // Flash effect for new comments could be added here
      }

      lastCommentId.current = latestId || null;
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, thread, sortBy]);

  useEffect(() => {
    fetchComments();

    // Set up polling for live updates
    let interval: NodeJS.Timeout | null = null;
    if (isLive) {
      interval = setInterval(fetchComments, 5000); // Refresh every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchComments, isLive]);

  const handlePostComment = async () => {
    if (!accessToken || !newCommentText.trim()) return;

    setIsPosting(true);
    try {
      await postComment(accessToken, `t3_${thread.post.id}`, newCommentText.trim());
      setNewCommentText('');
      fetchComments(); // Refresh comments
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleVote = async (commentId: string, direction: 1 | 0 | -1) => {
    if (!accessToken) return;

    try {
      await vote(accessToken, `t1_${commentId}`, direction);
      // Optimistically update the UI
      setComments(prev =>
        prev.map(c =>
          c.id === commentId
            ? { ...c, score: c.score + direction }
            : c
        )
      );
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 p-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-3 transition-colors"
        >
          <span>←</span>
          <span>Back to threads</span>
        </button>

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-blue-400">r/{thread.subreddit}</span>
            <h2 className="font-semibold text-sm mt-1 line-clamp-2">{thread.post.title}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isLive
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-700 text-gray-400'
              }`}
            >
              {isLive ? '● LIVE' : '○ Paused'}
            </button>
          </div>
        </div>

        {/* Sort options */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-gray-500">Sort:</span>
          {(['new', 'best', 'top'] as const).map(sort => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                sortBy === sort
                  ? 'bg-slate-700 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {sort.charAt(0).toUpperCase() + sort.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-slate-800 rounded-lg p-4 animate-pulse">
                <div className="h-3 bg-slate-700 rounded w-24 mb-2" />
                <div className="h-4 bg-slate-700 rounded w-full mb-1" />
                <div className="h-4 bg-slate-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No comments yet. Be the first!
          </div>
        ) : (
          comments.map(comment => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onVote={handleVote}
              isAuthenticated={isAuthenticated}
            />
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Comment input */}
      {isAuthenticated ? (
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newCommentText}
              onChange={e => setNewCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handlePostComment();
                }
              }}
            />
            <button
              onClick={handlePostComment}
              disabled={isPosting || !newCommentText.trim()}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-gray-500 rounded-lg font-medium transition-colors"
            >
              {isPosting ? '...' : 'Post'}
            </button>
          </div>
        </div>
      ) : (
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 p-4 text-center">
          <p className="text-sm text-gray-400">Sign in to comment</p>
        </div>
      )}
    </div>
  );
}

interface CommentCardProps {
  comment: RedditComment;
  onVote: (id: string, direction: 1 | 0 | -1) => void;
  isAuthenticated: boolean;
}

function CommentCard({ comment, onVote, isAuthenticated }: CommentCardProps) {
  const isDistinguished = comment.distinguished === 'moderator';
  const isStickied = comment.stickied;

  return (
    <div
      className={cn(
        'bg-slate-800 rounded-lg p-3 border border-slate-700',
        isStickied && 'border-green-700 bg-green-900/20',
        isDistinguished && 'border-green-600'
      )}
    >
      {/* Author line */}
      <div className="flex items-center gap-2 mb-2">
        <span className={cn(
          'text-xs font-medium',
          isDistinguished ? 'text-green-400' : 'text-gray-400'
        )}>
          u/{comment.author}
        </span>
        {comment.author_flair_text && (
          <span className="text-xs text-gray-500 bg-slate-700 px-1.5 py-0.5 rounded">
            {comment.author_flair_text}
          </span>
        )}
        {isDistinguished && (
          <span className="text-xs text-green-400 bg-green-900/50 px-1.5 py-0.5 rounded">
            MOD
          </span>
        )}
        <span className="text-xs text-gray-600">
          {formatRelativeTime(comment.created_utc)}
        </span>
      </div>

      {/* Comment body */}
      <p className="text-sm whitespace-pre-wrap break-words">{comment.body}</p>

      {/* Actions */}
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => isAuthenticated && onVote(comment.id, 1)}
            className="text-gray-500 hover:text-orange-400 transition-colors disabled:cursor-not-allowed"
            disabled={!isAuthenticated}
          >
            ▲
          </button>
          <span className="text-xs text-gray-400 min-w-[2ch] text-center">
            {comment.score}
          </span>
          <button
            onClick={() => isAuthenticated && onVote(comment.id, -1)}
            className="text-gray-500 hover:text-blue-400 transition-colors disabled:cursor-not-allowed"
            disabled={!isAuthenticated}
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  );
}
