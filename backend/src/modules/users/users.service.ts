// backend/src/modules/users/users.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto, ProfileStatsDto } from './dto/update-profile.dto';

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
        location: true,
        website: true,
        favoriteGenre: true,
        createdAt: true,
        updatedAt: true,
        isVerified: true,
        _count: {
          select: {
            reviews: true,
            followers: true,
            following: true,
            watchlists: true,
          },
        },
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
        location: true,
        website: true,
        favoriteGenre: true,
        createdAt: true,
        updatedAt: true,
        isVerified: true,
        _count: {
          select: {
            reviews: true,
            followers: true,
            following: true,
            watchlists: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // Check if display name is already taken (if being updated)
    if (dto.displayName) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          displayName: dto.displayName,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new ConflictException('Display name already taken');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatar: true,
        location: true,
        website: true,
        favoriteGenre: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async getProfileStats(userId: string): Promise<ProfileStatsDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            reviews: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get average rating
    const avgRating = await this.prisma.review.aggregate({
      where: { userId },
      _avg: { rating: true },
    });

    // Get total likes received on reviews
    const totalLikes = await this.prisma.like.count({
      where: {
        review: {
          userId,
        },
      },
    });

    // Get unique movies watched (reviewed)
    const moviesWatched = await this.prisma.review.groupBy({
      by: ['movieId'],
      where: { userId },
    });

    return {
      moviesWatched: moviesWatched.length,
      reviewsWritten: user._count.reviews,
      followers: user._count.followers,
      following: user._count.following,
      averageRating: Number((avgRating._avg.rating || 0).toFixed(2)),
      totalLikes,
      memberSince: user.createdAt,
    };
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
      averageRating: Number((stats._avg.rating || 0).toFixed(2)),
      totalLikes,
      totalComments,
      topReview,
      ratingDistribution: ratingDistribution.map((item) => ({
        rating: item.rating,
        count: item._count.rating,
      })),
    };
  }

  async getRecentActivity(userId: string, limit: number = 10) {
    const reviews = await this.prisma.review.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return reviews;
  }

  async searchUsers(query: string, limit: number = 20) {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        isVerified: true,
        _count: {
          select: {
            followers: true,
            reviews: true,
          },
        },
      },
    });

    return users;
  }

  async getTopCritics(limit: number = 10) {
    // Get users with most reviews
    const topCritics = await this.prisma.user.findMany({
      take: limit * 2, // Get more than needed to filter after calculating likes
      orderBy: {
        reviews: {
          _count: 'desc',
        },
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        isVerified: true,
        _count: {
          select: {
            reviews: true,
            followers: true,
          },
        },
      },
    });

    // Get total likes for each user
    const criticsWithLikes = await Promise.all(
      topCritics.map(async (critic) => {
        const totalLikes = await this.prisma.like.count({
          where: {
            review: {
              userId: critic.id,
            },
          },
        });

        return {
          ...critic,
          totalLikes,
        };
      })
    );

    // Sort by total likes and return top N
    return criticsWithLikes
      .sort((a, b) => b.totalLikes - a.totalLikes)
      .slice(0, limit);
  }
}