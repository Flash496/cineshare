// src/modules/reviews/analytics/analytics.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ReviewAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getMovieRatingBreakdown(movieId: number) {
    const distribution = await this.prisma.review.groupBy({
      by: ['rating'],
      where: { movieId },
      _count: { rating: true },
      orderBy: { rating: 'desc' },
    });

    // Create breakdown for all ratings 1-10
    const breakdown = Array.from({ length: 10 }, (_, i) => {
      const rating = i + 1;
      const found = distribution.find((d) => Math.floor(d.rating) === rating);
      return {
        rating,
        count: found?._count.rating || 0,
      };
    });

    const total = distribution.reduce((sum, d) => sum + d._count.rating, 0);

    return {
      breakdown: breakdown.map((item) => ({
        ...item,
        percentage: total > 0 ? (item.count / total) * 100 : 0,
      })),
      total,
    };
  }

  async getReviewTrends(movieId: number, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const reviews = await this.prisma.review.findMany({
      where: {
        movieId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        rating: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date
    const trendsByDate = reviews.reduce((acc, review) => {
      const date = review.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { count: 0, totalRating: 0 };
      }
      acc[date].count++;
      acc[date].totalRating += review.rating;
      return acc;
    }, {} as Record<string, { count: number; totalRating: number }>);

    return Object.entries(trendsByDate).map(([date, data]) => ({
      date,
      count: data.count,
      averageRating: data.totalRating / data.count,
    }));
  }

  async getTopReviewers(movieId: number, limit: number = 10) {
    const reviews = await this.prisma.review.findMany({
      where: { movieId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    // Sort by engagement (likes + comments)
    const sorted = reviews
      .map((review) => ({
        ...review,
        engagement: review._count.likes + review._count.comments,
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, limit);

    return sorted;
  }

  async getReviewInsights(movieId: number) {
    const reviews = await this.prisma.review.findMany({
      where: { movieId },
      select: {
        rating: true,
        hasSpoilers: true,
        content: true,
      },
    });

    const totalReviews = reviews.length;

    // Handle empty reviews
    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingStdDev: 0,
        spoilerPercentage: 0,
        averageContentLength: 0,
        consensus: 'No reviews yet',
      };
    }

    const withSpoilers = reviews.filter((r) => r.hasSpoilers).length;
    const avgContentLength =
      reviews.reduce((sum, r) => sum + r.content.length, 0) / totalReviews;

    // Rating variance
    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
    const variance =
      reviews.reduce((sum, r) => sum + Math.pow(r.rating - avgRating, 2), 0) /
      totalReviews;
    const stdDev = Math.sqrt(variance);

    return {
      totalReviews,
      averageRating: Number(avgRating.toFixed(2)),
      ratingStdDev: Number(stdDev.toFixed(2)),
      spoilerPercentage: Number(((withSpoilers / totalReviews) * 100).toFixed(2)),
      averageContentLength: Math.round(avgContentLength),
      consensus: this.getRatingConsensus(stdDev),
    };
  }

  private getRatingConsensus(stdDev: number): string {
    if (stdDev < 1) return 'Strong consensus';
    if (stdDev < 2) return 'General agreement';
    if (stdDev < 3) return 'Mixed opinions';
    return 'Highly divisive';
  }

  // ✅ Bonus: Get comparison with similar movies
  async getComparativeAnalysis(movieId: number, genreIds: number[] = []) {
    const movieStats = await this.getReviewInsights(movieId);

    // If genres provided, compare with movies in same genre
    if (genreIds.length > 0) {
      // This would require a movie table with genres
      // For now, just return the movie stats
      return {
        movieStats,
        comparisonAvailable: false,
      };
    }

    return {
      movieStats,
      comparisonAvailable: false,
    };
  }

  // ✅ Bonus: Get sentiment distribution
  async getSentimentDistribution(movieId: number) {
    const reviews = await this.prisma.review.findMany({
      where: { movieId },
      select: { rating: true },
    });

    const totalReviews = reviews.length;
    if (totalReviews === 0) {
      return {
        positive: 0,
        neutral: 0,
        negative: 0,
      };
    }

    const positive = reviews.filter((r) => r.rating >= 7).length;
    const neutral = reviews.filter((r) => r.rating >= 5 && r.rating < 7).length;
    const negative = reviews.filter((r) => r.rating < 5).length;

    return {
      positive: Number(((positive / totalReviews) * 100).toFixed(2)),
      neutral: Number(((neutral / totalReviews) * 100).toFixed(2)),
      negative: Number(((negative / totalReviews) * 100).toFixed(2)),
    };
  }
}