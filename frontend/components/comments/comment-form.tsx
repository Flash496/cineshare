// frontend/components/comments/comment-form.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Comment } from '@/types/comment';

interface CommentFormProps {
  reviewId: string;
  parentId?: string;
  initialContent?: string;
  onCommentAdded: (comment: Comment) => void;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
}

const MAX_COMMENT_LENGTH = 2000;

export function CommentForm({
  reviewId,
  parentId,
  initialContent = '',
  onCommentAdded,
  onCancel,
  placeholder = 'Write a comment...',
  submitLabel,
}: CommentFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState(initialContent);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!initialContent;
  const defaultSubmitLabel = isEditing ? 'Update' : 'Post Comment';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || !user) return;

    if (content.length > MAX_COMMENT_LENGTH) {
      toast.error(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`);
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const response = await fetch(`${API_URL}/comments/reviews/${reviewId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: content.trim(),
          parentId,
        }),
      });

      if (response.ok) {
        const newComment = await response.json();
        onCommentAdded(newComment);
        setContent('');
        toast.success(isEditing ? 'Comment updated' : 'Comment posted');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to post comment'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Please sign in to comment
      </div>
    );
  }

  const isOverLimit = content.length > MAX_COMMENT_LENGTH;
  const showCharCount = content.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={user.avatar} alt={user.displayName} />
          <AvatarFallback>
            {user.displayName?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="min-h-[100px] resize-none"
            disabled={submitting}
            maxLength={MAX_COMMENT_LENGTH + 100} // Allow typing slightly over to show error
          />
        </div>
      </div>

      {showCharCount && (
        <div
          className={`text-xs ${
            isOverLimit ? 'text-destructive' : 'text-muted-foreground'
          }`}
        >
          {content.length}/{MAX_COMMENT_LENGTH} characters
          {!isOverLimit &&
            content.length > 0 &&
            ' • Use @username to mention someone'}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onCancel();
              setContent(initialContent);
            }}
            disabled={submitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={!content.trim() || submitting || isOverLimit}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Updating...' : 'Posting...'}
            </>
          ) : (
            submitLabel || defaultSubmitLabel
          )}
        </Button>
      </div>
    </form>
  );
}