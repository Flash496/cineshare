// frontend/components/feed/activity-feed.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { FeedItem } from './feed-item';
import { RefreshCw } from 'lucide-react';

interface FeedResponse {
  items: any[];
  hasMore: boolean;
  nextPage: number | null;
}

export function ActivityFeed() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  const fetchFeed = useCallback(
    async (pageNum: number, append: boolean = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        // Get token from localStorage (where your auth context stores it)
        const token = typeof window !== 'undefined' 
          ? localStorage.getItem('accessToken') 
          : null;

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`/api/feed?page=${pageNum}&limit=20`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch feed');
        }

        const data: FeedResponse = await response.json();

        if (append) {
          setItems((prev) => [...prev, ...data.items]);
        } else {
          setItems(data.items);
        }

        setHasMore(data.hasMore);
        setError(null);
      } catch (err) {
        setError('Failed to load feed. Please try again.');
        console.error('Feed error:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    if (user) {
      fetchFeed(1, false);
    }
  }, [user, fetchFeed]);

  useEffect(() => {
    if (inView && hasMore && !loadingMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFeed(nextPage, true);
    }
  }, [inView, hasMore, loadingMore, loading, page, fetchFeed]);

  const handleRefresh = () => {
    setPage(1);
    fetchFeed(1, false);
  };

  if (loading && items.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }, (_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-20 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="space-y-4">
            <p className="text-destructive">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Your feed is empty. Start following users to see their activity!
            </p>
            <Button onClick={() => (window.location.href = '/discover')}>
              Discover Users
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Feed</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <FeedItem key={item.id} item={item} />
        ))}
      </div>

      {hasMore && (
        <div ref={ref} className="py-4 text-center">
          {loadingMore && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          You've reached the end of your feed
        </p>
      )}
    </div>
  );
}