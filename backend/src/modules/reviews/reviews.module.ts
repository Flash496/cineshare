// backend/src/modules/reviews/reviews.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReviewOwnerGuard } from './guards/review-owner.guard';
import { ReviewAnalyticsModule } from './analytics/analytics.module';
import { FeedModule } from '../feed/feed.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    ReviewAnalyticsModule,
    forwardRef(() => FeedModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewOwnerGuard],
  exports: [ReviewsService],
})
export class ReviewsModule {}