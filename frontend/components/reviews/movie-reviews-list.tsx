// frontend/components/reviews/movie-reviews-list.tsx
'use client';

import { useEffect, useState } from 'react';
import { ReviewCard } from './review-card';
import { ReviewFilters } from './review-filters';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface Review {
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
}

interface MovieReviewsListProps {
  movieId: number;
}

export function MovieReviewsList({ movieId }: MovieReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<any>({ sortBy: 'recent' });

  useEffect(() => {
    fetchReviews(1, filters);
  }, [movieId]);

  const fetchReviews = async (pageNum: number, newFilters?: any) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const filterParams = newFilters || filters;
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
        sortBy: filterParams.sortBy,
      });

      if (filterParams.minRating !== undefined) {
        params.append('minRating', filterParams.minRating.toString());
      }
      if (filterParams.maxRating !== undefined) {
        params.append('maxRating', filterParams.maxRating.toString());
      }
      if (filterParams.spoilersOnly) {
        params.append('spoilersOnly', 'true');
      }
      if (filterParams.noSpoilers) {
        params.append('noSpoilers', 'true');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reviews/movie/${movieId}?${params.toString()}`
      );

      if (!response.ok) throw new Error('Failed to fetch reviews');
      const data = await response.json();

      if (pageNum === 1) {
        setReviews(data.reviews);
      } else {
        setReviews((prev) => [...prev, ...data.reviews]);
      }

      setHasMore(data.pagination.page < data.pagination.pages);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1);
    fetchReviews(1, newFilters);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/50 rounded-lg">
        <p className="text-muted-foreground text-lg">
          No reviews yet. Be the first to share your thoughts!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Reviews ({reviews.length})</h2>
        <ReviewFilters onFilterChange={handleFilterChange} />
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loadingMore}
            className="min-w-[200px]"
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Reviews'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}