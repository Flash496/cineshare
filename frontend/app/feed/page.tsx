// frontend/app/feed/page.tsx
'use client';

import { Suspense } from 'react';
import { ActivityFeed } from '@/components/feed/activity-feed';
import { FeedFilters } from '@/components/feed/feed-filters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Users } from 'lucide-react';

export default function FeedPage() {
  const handleFilterChange = (filters: {
    types: string[];
    sortBy: 'recent' | 'popular';
  }) => {
    // TODO: Implement filtering logic
    console.log('Filters changed:', filters);
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Feed</h1>
            <p className="text-muted-foreground mt-1">
              Stay updated with what cinephiles are watching
            </p>
          </div>
          <FeedFilters onFilterChange={handleFilterChange} />
        </div>

        {/* Tabs for Following/Discover */}
        <Tabs defaultValue="following" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="following" className="gap-2">
              <Users className="h-4 w-4" />
              Following
            </TabsTrigger>
            <TabsTrigger value="discover" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Discover
            </TabsTrigger>
          </TabsList>

          <TabsContent value="following" className="mt-6">
            <Suspense fallback={<FeedSkeleton />}>
              <ActivityFeed />
            </Suspense>
          </TabsContent>

          <TabsContent value="discover" className="mt-6">
            <Suspense fallback={<FeedSkeleton />}>
              <DiscoverFeed />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function DiscoverFeed() {
  // Similar implementation to ActivityFeed but fetches from /api/feed/discover
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <div className="space-y-4">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold">Discover Feed Coming Soon</h3>
            <p className="text-muted-foreground text-sm mt-2">
              Explore trending reviews and popular movies from the community
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-[120px] w-[80px] rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}