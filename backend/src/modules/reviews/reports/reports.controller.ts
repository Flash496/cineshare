// backend/src/modules/reviews/reports/reports.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ReportsService, ReportReason } from './reports.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { IsEnum, IsOptional, IsString } from 'class-validator';

class ReportReviewDto {
  @IsEnum(ReportReason)
  reason: ReportReason;

  @IsOptional()
  @IsString()
  details?: string;
}

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post(':id/report')
  reportReview(
    @Param('id') reviewId: string,
    @GetUser('userId') userId: string,
    @Body(ValidationPipe) dto: ReportReviewDto,
  ) {
    return this.reportsService.reportReview(
      userId,
      reviewId,
      dto.reason,
      dto.details,
    );
  }
}