// frontend/components/reviews/review-card.tsx
'use client';

import { ReportReviewDialog } from './report-review-dialog';
import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  ThumbsUp,
  MessageCircle,
  AlertTriangle,
  MoreHorizontal,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    title?: string;
    content: string;
    hasSpoilers: boolean;
    createdAt: string;
    user: {
      id: string;
      username: string;
      displayName: string;
      avatar?: string;
    };
    _count: {
      likes: number;
      comments: number;
    };
  };
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ReviewCard({ review, onEdit, onDelete }: ReviewCardProps) {
  const { user } = useAuth();
  const [showSpoilers, setShowSpoilers] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(review._count.likes);
  const isOwner = user?.id === review.user.id; // ✅ Changed from userId to id

  const handleLike = async () => {
    // Optimistic update
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));

    // TODO: API call to like/unlike
  };

  const getRatingColor = (rating: number) => {
    if (rating <= 2) return 'text-red-500';
    if (rating <= 4) return 'text-orange-500';
    if (rating <= 6) return 'text-yellow-500';
    if (rating <= 8) return 'text-blue-500';
    return 'text-green-500';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Link href={`/profile/${review.user.username}`}>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={review.user.avatar} />
                  <AvatarFallback>
                    {getInitials(review.user.displayName)}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div>
                <Link
                  href={`/profile/${review.user.username}`}
                  className="font-semibold hover:underline"
                >
                  {review.user.displayName}
                </Link>
                <p className="text-sm text-muted-foreground">
                  @{review.user.username} •{' '}
                  {formatDistanceToNow(new Date(review.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>

            {/* Actions Dropdown */}
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Review
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Review
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className={cn('flex items-center gap-1 font-semibold', getRatingColor(review.rating))}>
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-lg">{review.rating}</span>
              <span className="text-sm text-muted-foreground">/10</span>
            </div>
          </div>

          {/* Title */}
          {review.title && (
            <h3 className="text-lg font-semibold">{review.title}</h3>
          )}

          {/* Content */}
          {review.hasSpoilers && !showSpoilers ? (
            <div className="space-y-3 p-4 border border-orange-500/20 rounded-lg bg-orange-500/5">
              <div className="flex items-center gap-2 text-orange-500">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">This review contains spoilers</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSpoilers(true)}
              >
                Show Review
              </Button>
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {review.content}
            </p>
          )}

          {review.hasSpoilers && showSpoilers && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSpoilers(false)}
            >
              Hide Spoilers
            </Button>
          )}

          {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
            <Button
                variant="ghost"
                size="sm"
                className={cn('gap-2', liked && 'text-red-500')}
                onClick={handleLike}
            >
                <ThumbsUp className={cn('h-4 w-4', liked && 'fill-current')} />
                <span>{likeCount}</span>
            </Button>

            <Button variant="ghost" size="sm" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                <span>{review._count.comments}</span>
            </Button>

            {!isOwner && <ReportReviewDialog reviewId={review.id} />}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}