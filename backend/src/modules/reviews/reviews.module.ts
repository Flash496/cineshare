// src/modules/reviews/reviews.module.ts
import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReviewOwnerGuard } from './guards/review-owner.guard';
import { ReviewAnalyticsModule } from './analytics/analytics.module'; // ✅ Add this

@Module({
  imports: [
    PrismaModule,
    ReviewAnalyticsModule, // ✅ Add this
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewOwnerGuard],
  exports: [ReviewsService],
})
export class ReviewsModule {}