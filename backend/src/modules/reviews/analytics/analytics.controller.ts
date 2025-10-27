// src/modules/reviews/analytics/analytics.controller.ts
import { 
  Controller, 
  Get, 
  Param, 
  Query, 
  ParseIntPipe,
  DefaultValuePipe 
} from '@nestjs/common';
import { ReviewAnalyticsService } from './analytics.service';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('reviews/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: ReviewAnalyticsService) {}

  @Public()
  @Get('movie/:movieId/breakdown')
  getRatingBreakdown(@Param('movieId', ParseIntPipe) movieId: number) {
    return this.analyticsService.getMovieRatingBreakdown(movieId);
  }

  @Public()
  @Get('movie/:movieId/trends')
  getReviewTrends(
    @Param('movieId', ParseIntPipe) movieId: number,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number, // ✅ Fixed
  ) {
    return this.analyticsService.getReviewTrends(movieId, days);
  }

  @Public()
  @Get('movie/:movieId/top-reviewers')
  getTopReviewers(
    @Param('movieId', ParseIntPipe) movieId: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number, // ✅ Fixed
  ) {
    return this.analyticsService.getTopReviewers(movieId, limit);
  }

  @Public()
  @Get('movie/:movieId/insights')
  getInsights(@Param('movieId', ParseIntPipe) movieId: number) {
    return this.analyticsService.getReviewInsights(movieId);
  }

  // ✅ Bonus: Add sentiment endpoint
  @Public()
  @Get('movie/:movieId/sentiment')
  getSentiment(@Param('movieId', ParseIntPipe) movieId: number) {
    return this.analyticsService.getSentimentDistribution(movieId);
  }
}