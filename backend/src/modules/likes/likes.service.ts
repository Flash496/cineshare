// backend/src/modules/likes/likes.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LikesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  async likeReview(userId: string, reviewId: string) {
    // Check if review exists
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
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
    const like = await this.prisma.like.create({
      data: {
        userId,
        reviewId,
      },
    });

    // Get liker's information
    const liker = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { 
        displayName: true,
        username: true,
      },
    });

    // Notify review author (don't notify self)
    if (review.userId !== userId) {
      try {
        const likerName = liker?.displayName || liker?.username || 'Someone';
        const reviewTitle = review.title ? ` "${review.title}"` : '';
        
        await this.notificationsService.createNotification({
          userId: review.userId,
          type: 'like',
          actorId: userId,
          referenceId: reviewId,
          message: `liked your review${reviewTitle}`,
          link: `/reviews/${reviewId}`,
        });
      } catch (error) {
        console.error('Failed to send like notification:', error);
        // Don't fail the like operation if notification fails
      }
    }

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

  async getUserLikes(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [likes, total] = await Promise.all([
      this.prisma.like.findMany({
        where: { userId },
        include: {
          review: {
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
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.like.count({
        where: { userId },
      }),
    ]);

    return {
      likes: likes.map((l) => l.review),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}