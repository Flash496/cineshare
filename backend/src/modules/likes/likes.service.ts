// backend/src/modules/likes/likes.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LikesService {
  constructor(private prisma: PrismaService) {}

  async likeReview(userId: string, reviewId: string) {
    // Check if review exists
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check if already liked
    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_reviewId: {
          userId,
          reviewId,
        },
      },
    });

    if (existingLike) {
      throw new ConflictException('You have already liked this review');
    }

    // Create like
    await this.prisma.like.create({
      data: {
        userId,
        reviewId,
      },
    });

    // Get updated like count
    const likeCount = await this.prisma.like.count({
      where: { reviewId },
    });

    return {
      message: 'Review liked successfully',
      likeCount,
    };
  }

  async unlikeReview(userId: string, reviewId: string) {
    const like = await this.prisma.like.findUnique({
      where: {
        userId_reviewId: {
          userId,
          reviewId,
        },
      },
    });

    if (!like) {
      throw new NotFoundException('You have not liked this review');
    }

    await this.prisma.like.delete({
      where: {
        userId_reviewId: {
          userId,
          reviewId,
        },
      },
    });

    // Get updated like count
    const likeCount = await this.prisma.like.count({
      where: { reviewId },
    });

    return {
      message: 'Review unliked successfully',
      likeCount,
    };
  }

  async hasUserLikedReview(userId: string, reviewId: string): Promise<boolean> {
    const like = await this.prisma.like.findUnique({
      where: {
        userId_reviewId: {
          userId,
          reviewId,
        },
      },
    });

    return !!like;
  }

  async getReviewLikes(reviewId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [likes, total] = await Promise.all([
      this.prisma.like.findMany({
        where: { reviewId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.like.count({
        where: { reviewId },
      }),
    ]);

    return {
      likes: likes.map((l) => l.user),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}