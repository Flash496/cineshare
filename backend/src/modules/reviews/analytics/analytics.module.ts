// src/modules/reviews/analytics/analytics.module.ts
import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { ReviewAnalyticsService } from './analytics.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [ReviewAnalyticsService],
  exports: [ReviewAnalyticsService],
})
export class ReviewAnalyticsModule {}