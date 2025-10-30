// backend/src/modules/social/social.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SocialService {
  constructor(private prisma: PrismaService) {}

  async followUser(followerId: string, followingId: string) {
    // Prevent self-follow
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Check if target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if already following
    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      throw new ConflictException('You are already following this user');
    }

    // Create follow relationship
    const follow = await this.prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    // TODO: Create notification for the followed user

    return {
      message: 'Successfully followed user',
      user: follow.following,
    };
  }

  async unfollowUser(followerId: string, followingId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!follow) {
      throw new NotFoundException('You are not following this user');
    }

    await this.prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return { message: 'Successfully unfollowed user' };
  }

  async getFollowers(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              bio: true,
              _count: {
                select: {
                  followers: true,
                  reviews: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.follow.count({
        where: { followingId: userId },
      }),
    ]);

    return {
      followers: followers.map((f) => f.follower),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getFollowing(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              bio: true,
              _count: {
                select: {
                  followers: true,
                  reviews: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.follow.count({
        where: { followerId: userId },
      }),
    ]);

    return {
      following: following.map((f) => f.following),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return !!follow;
  }

  async getSuggestedUsers(userId: string, limit: number = 10) {
    // Get users that the current user's followings also follow
    // but the current user doesn't follow yet
    const suggested = await this.prisma.$queryRaw`
      SELECT DISTINCT u.id, u.username, u."displayName", u.avatar, u.bio,
        COUNT(DISTINCT r.id) as review_count,
        COUNT(DISTINCT f.id) as follower_count
      FROM "User" u
      LEFT JOIN "Review" r ON r."userId" = u.id
      LEFT JOIN "Follow" f ON f."followingId" = u.id
      WHERE u.id != ${userId}
        AND u.id NOT IN (
          SELECT "followingId" FROM "Follow" WHERE "followerId" = ${userId}
        )
        AND u.id IN (
          SELECT DISTINCT f2."followingId"
          FROM "Follow" f1
          JOIN "Follow" f2 ON f1."followingId" = f2."followerId"
          WHERE f1."followerId" = ${userId}
            AND f2."followingId" != ${userId}
        )
      GROUP BY u.id, u.username, u."displayName", u.avatar, u.bio
      ORDER BY follower_count DESC, review_count DESC
      LIMIT ${limit}
    `;

    return suggested;
  }
}