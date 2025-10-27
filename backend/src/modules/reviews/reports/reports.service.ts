// backend/src/modules/reviews/reports/reports.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export enum ReportReason {
  SPAM = 'spam',
  OFFENSIVE = 'offensive',
  SPOILERS = 'spoilers',
  MISINFORMATION = 'misinformation',
  OTHER = 'other',
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async reportReview(
    userId: string,
    reviewId: string,
    reason: ReportReason,
    details?: string,
  ) {
    // Check if review exists
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check if user already reported this review
    const existingReport = await this.prisma.reviewReport.findUnique({
      where: {
        userId_reviewId: {
          userId,
          reviewId,
        },
      },
    });

    if (existingReport) {
      throw new ConflictException('You have already reported this review');
    }

    // Create report
    return this.prisma.reviewReport.create({
      data: {
        userId,
        reviewId,
        reason,
        details,
      },
    });
  }

  async getReportsByReview(reviewId: string) {
    return this.prisma.reviewReport.findMany({
      where: { reviewId },
      include: {
        user: {
          select: {
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingReports(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      this.prisma.reviewReport.findMany({
        where: { status: 'pending' },
        include: {
          review: {
            include: {
              user: {
                select: {
                  username: true,
                  displayName: true,
                },
              },
            },
          },
          user: {
            select: {
              username: true,
              displayName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.reviewReport.count({ where: { status: 'pending' } }),
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateReportStatus(reportId: string, status: 'reviewed' | 'dismissed') {
    return this.prisma.reviewReport.update({
      where: { id: reportId },
      data: { status },
    });
  }
}