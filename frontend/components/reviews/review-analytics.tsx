// frontend/components/reviews/review-analytics.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, AlertTriangle } from 'lucide-react';

interface ReviewAnalyticsProps {
  movieId: number;
}

interface RatingBreakdownItem {
  rating: number;
  count: number;
  percentage: number;
}

interface BreakdownData {
  breakdown: RatingBreakdownItem[];
  total: number;
}

interface InsightsData {
  totalReviews: number;
  averageRating: number;
  ratingStdDev: number;
  spoilerPercentage: number;
  averageContentLength: number;
  consensus: string;
}

export function ReviewAnalytics({ movieId }: ReviewAnalyticsProps) {
  const [breakdown, setBreakdown] = useState<BreakdownData | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [movieId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const [breakdownRes, insightsRes] = await Promise.all([
        fetch(`${API_URL}/reviews/analytics/movie/${movieId}/breakdown`),
        fetch(`${API_URL}/reviews/analytics/movie/${movieId}/insights`),
      ]);

      if (!breakdownRes.ok || !insightsRes.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const [breakdownData, insightsData] = await Promise.all([
        breakdownRes.json(),
        insightsRes.json(),
      ]);

      setBreakdown(breakdownData);
      setInsights(insightsData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !breakdown || !insights) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            {error || 'No analytics available'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {breakdown.breakdown
            .slice()
            .reverse()
            .map((item) => (
              <div key={item.rating} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{item.rating}★</span>
                    <span className="text-muted-foreground">
                      ({item.count} {item.count === 1 ? 'review' : 'reviews'})
                    </span>
                  </span>
                  <span className="font-medium">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Consensus</p>
                <p className="text-lg font-semibold">{insights.consensus}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  σ = {insights.ratingStdDev.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Avg Length</p>
                <p className="text-lg font-semibold">
                  {insights.averageContentLength} chars
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {insights.totalReviews} total reviews
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Spoilers</p>
                <p className="text-lg font-semibold">
                  {insights.spoilerPercentage.toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  of reviews contain spoilers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}