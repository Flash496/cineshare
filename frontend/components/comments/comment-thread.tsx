// frontend/components/comments/comment-thread.tsx
'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, MoreHorizontal, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import Link from 'next/link';

interface CommentData {
  id: string;
  content: string;
  userId: string;
  user: {
    username: string;
    displayName: string;
    avatar?: string;
  };
  createdAt: string;
  isEdited: boolean;
  likes?: number;
  replies?: CommentData[];
  _count?: {
    replies: number;
  };
}

interface CommentThreadProps {
  reviewId: string;
  onCommentAdded?: () => void;
}

export function CommentThread({
  reviewId,
  onCommentAdded,
}: CommentThreadProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [reviewId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(
        `/api/comments/reviews/${reviewId}?limit=20`
      );
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please log in to comment');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Please write something');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `/api/comments/reviews/${reviewId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: newComment.trim(),
            parentId: replyingTo,
          }),
        }
      );

      if (response.ok) {
        const newCommentData = await response.json();
        if (replyingTo) {
          // Add as reply
          setComments((prev) =>
            prev.map((c) =>
              c.id === replyingTo
                ? {
                    ...c,
                    replies: [...(c.replies || []), newCommentData],
                  }
                : c
            )
          );
        } else {
          // Add as top-level comment
          setComments((prev) => [newCommentData, ...prev]);
        }
        setNewComment('');
        setReplyingTo(null);
        onCommentAdded?.();
        toast.success('Comment posted');
      }
    } catch (error) {
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      {user && (
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <div className="flex gap-3">
            <Avatar>
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder={
                  replyingTo
                    ? 'Write a reply...'
                    : 'Share your thoughts...'
                }
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-24"
              />
              <div className="flex justify-end gap-2">
                {replyingTo && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                  >
                    Cancel Reply
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                >
                  {submitting ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              reviewId={reviewId}
              onReplyClick={() => setReplyingTo(comment.id)}
              onCommentAdded={fetchComments}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  reviewId,
  onReplyClick,
  onCommentAdded,
}: {
  comment: CommentData;
  reviewId: string;
  onReplyClick: () => void;
  onCommentAdded: () => void;
}) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes || 0);
  const [showReplies, setShowReplies] = useState(false);

  const handleLike = async () => {
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }

    const token = localStorage.getItem('accessToken');
    const method = liked ? 'DELETE' : 'POST';

    try {
      const response = await fetch(
        `/api/comments/${comment.id}/like`,
        {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLiked(!liked);
        setLikeCount(data.likeCount);
      }
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Link href={`/profile/${comment.user.username}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={comment.user.avatar} />
            <AvatarFallback>{comment.user.displayName[0]}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 space-y-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/profile/${comment.user.username}`}
                className="font-semibold hover:underline"
              >
                {comment.user.displayName}
              </Link>
              <span className="text-sm text-muted-foreground">
                @{comment.user.username}
              </span>
            </div>

            <p className="text-sm leading-relaxed">{comment.content}</p>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span>
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                })}
              </span>
              {comment.isEdited && <span>(edited)</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className="gap-1 h-8"
            >
              <Heart
                className={`h-4 w-4 ${
                  liked ? 'fill-red-500 text-red-500' : ''
                }`}
              />
              {likeCount > 0 && likeCount}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onReplyClick}
              className="gap-1 h-8"
            >
              <MessageCircle className="h-4 w-4" />
              Reply
            </Button>

            {user?.id === comment.userId && (
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-12 space-y-3 border-l-2 border-border pl-4">
          {showReplies ? (
            comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                reviewId={reviewId}
                onReplyClick={onReplyClick}
                onCommentAdded={onCommentAdded}
              />
            ))
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplies(true)}
            >
              Show {comment.replies.length} repl
              {comment.replies.length > 1 ? 'ies' : 'y'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}