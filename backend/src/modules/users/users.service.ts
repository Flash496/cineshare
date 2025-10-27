// backend/src/modules/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getUserReviewStats(userId: string) {
    const [stats, topReview] = await Promise.all([
      this.prisma.review.aggregate({
        where: { userId },
        _avg: { rating: true },
        _count: { id: true },
      }),
      this.prisma.review.findFirst({
        where: { userId },
        orderBy: {
          likes: {
            _count: 'desc',
          },
        },
        include: {
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      }),
    ]);

    // Get total likes and comments
    const allReviews = await this.prisma.review.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    const totalLikes = allReviews.reduce(
      (sum, review) => sum + review._count.likes,
      0
    );
    const totalComments = allReviews.reduce(
      (sum, review) => sum + review._count.comments,
      0
    );

    // Get rating distribution
    const ratingDistribution = await this.prisma.review.groupBy({
      by: ['rating'],
      where: { userId },
      _count: { rating: true },
      orderBy: { rating: 'desc' },
    });

    return {
      totalReviews: stats._count.id,
      averageRating: stats._avg.rating || 0,
      totalLikes,
      totalComments,
      topReview,
      ratingDistribution: ratingDistribution.map((item) => ({
        rating: item.rating,
        count: item._count.rating,
      })),
    };
  }

  async updateProfile(
    userId: string,
    data: {
      displayName?: string;
      bio?: string;
      avatar?: string;
    }
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatar: true,
      },
    });
  }
}