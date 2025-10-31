// frontend/components/movies/movie-reviews.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Star, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  author: string;
  author_details: {
    name: string;
    username: string;
    avatar_path: string | null;
    rating: number | null;
  };
  content: string;
  created_at: string;
  updated_at: string;
}

interface MovieReviewsProps {
  movieId: number;
}

export function MovieReviews({ movieId }: MovieReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/movies/${movieId}/reviews`);
        if (!response.ok) {
          console.error('Failed to fetch reviews:', response.status);
          return;
        }
        const data = await response.json();
        // Handle TMDB review response format
        if (data.results) {
          setReviews(data.results);
        } else if (Array.isArray(data)) {
          setReviews(data);
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [movieId]);

  const toggleExpanded = (reviewId: string) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAvatarUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('/http')) {
      return path.substring(1);
    }
    return `https://image.tmdb.org/t/p/w200${path}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No reviews yet. Be the first to share your thoughts!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reviews ({reviews.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {reviews.map((review) => {
          const isExpanded = expandedReviews.has(review.id);
          const contentLength = review.content.length;
          const shouldTruncate = contentLength > 400;

          return (
            <div key={review.id} className="space-y-3 pb-6 border-b last:border-0 last:pb-0">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={getAvatarUrl(review.author_details.avatar_path) || undefined} 
                    alt={review.author}
                  />
                  <AvatarFallback>
                    {getInitials(review.author_details.name || review.author)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold">
                      {review.author_details.name || review.author}
                    </h4>
                    {review.author_details.rating && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">
                          {review.author_details.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(review.created_at)}
                  </p>
                </div>
              </div>

              <div className="relative">
                <p className={cn(
                  "text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap",
                  !isExpanded && shouldTruncate && "line-clamp-6"
                )}>
                  {review.content}
                </p>
                
                {shouldTruncate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(review.id)}
                    className="mt-2 h-auto p-0 text-primary hover:text-primary/80"
                  >
                    {isExpanded ? 'Show less' : 'Read more'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}