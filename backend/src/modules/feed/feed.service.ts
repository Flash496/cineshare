// backend/src/modules/feed/feed.service.ts
import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity } from '../../schemas/activity.schema';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../modules/cache/cache.service';
import { FeedGateway } from './feed.gateway';

export interface FeedItem {
  id: string;
  type: 'review' | 'follow' | 'watchlist' | 'like';
  actor: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
  target?: any;
  createdAt: Date;
  metadata?: any;
}

@Injectable()
export class FeedService {
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
    private prisma: PrismaService,
    private cacheService: CacheService,
    @Inject(forwardRef(() => FeedGateway))
    private feedGateway: FeedGateway, // Inject gateway
  ) {}

  /**
   * Feed Algorithm Strategy:
   * 1. Get list of users the current user follows
   * 2. Fetch recent activities from those users
   * 3. Mix with trending/popular content
   * 4. Apply relevance scoring
   * 5. Sort by recency and relevance
   * 6. Cache aggressively (1-5 minutes)
   */
  async generateFeed(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    items: FeedItem[];
    hasMore: boolean;
    nextPage: number | null;
  }> {
    const cacheKey = `feed:${userId}:${page}`;

    // Check cache first
    const cachedFeed = await this.cacheService.get<any>(cacheKey);
    if (cachedFeed) {
      return cachedFeed;
    }

    // Get list of users the current user follows
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);

    // Include own activity
    followingIds.push(userId);

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Fetch activities from followed users and self
    const activities = await this.activityModel
      .find({
        actorId: { $in: followingIds },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1) // Fetch one extra to check if there are more
      .lean()
      .exec();

    const hasMore = activities.length > limit;
    const items = activities.slice(0, limit);

    // Enrich activities with user data
    const enrichedItems = await this.enrichActivities(items);

    const result = {
      items: enrichedItems,
      hasMore,
      nextPage: hasMore ? page + 1 : null,
    };

    // Cache for 2 minutes
    await this.cacheService.set(cacheKey, result, 120);

    return result;
  }

  private async enrichActivities(activities: any[]): Promise<FeedItem[]> {
    // Get unique user IDs
    const userIds = [...new Set(activities.map((a) => a.actorId))];

    // Fetch user details in bulk
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    // Enrich each activity
    return Promise.all(
      activities.map(async (activity) => {
        const actor = userMap.get(activity.actorId);

        let enrichedItem: FeedItem = {
          id: activity._id.toString(),
          type: activity.type,
          actor: actor ?? {
            id: activity.actorId,
            username: 'Unknown',
            displayName: 'Unknown User',
            avatar: '',
          },
          createdAt: activity.createdAt,
        };

        // Enrich based on activity type
        switch (activity.type) {
          case 'review':
            enrichedItem.target = await this.enrichReviewActivity(activity);
            break;
          case 'follow':
            enrichedItem.target = await this.enrichFollowActivity(activity);
            break;
          case 'watchlist':
            enrichedItem.target = await this.enrichWatchlistActivity(activity);
            break;
          case 'like':
            enrichedItem.target = await this.enrichLikeActivity(activity);
            break;
        }

        return enrichedItem;
      })
    );
  }

  private async enrichReviewActivity(activity: any) {
    const review = await this.prisma.review.findUnique({
      where: { id: activity.data.reviewId },
      select: {
        id: true,
        rating: true,
        title: true,
        content: true,
        hasSpoilers: true,
        createdAt: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return {
      review,
      movie: {
        id: activity.data.movieId,
        title: activity.data.movieTitle,
        posterPath: activity.data.posterPath,
      },
    };
  }

  private async enrichFollowActivity(activity: any) {
    const followedUser = await this.prisma.user.findUnique({
      where: { id: activity.data.followedUserId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
      },
    });

    return { user: followedUser };
  }

  private async enrichWatchlistActivity(activity: any) {
    return {
      watchlist: {
        id: activity.data.watchlistId,
        name: activity.data.watchlistName,
        movieCount: activity.data.movieCount,
      },
      movie: activity.data.movie,
    };
  }

  private async enrichLikeActivity(activity: any) {
    const review = await this.prisma.review.findUnique({
      where: { id: activity.data.reviewId },
      select: {
        id: true,
        movieId: true,
        title: true,
        user: {
          select: {
            username: true,
            displayName: true,
          },
        },
      },
    });

    return {
      review,
      movie: {
        id: activity.data.movieId,
        title: activity.data.movieTitle,
      },
    };
  }

  async createActivity(data: {
    userId: string;
    actorId: string;
    type: 'review' | 'follow' | 'watchlist' | 'like' | 'comment';
    metadata: any;
  }) {
    const activity = new this.activityModel({
      userId: data.userId,
      actorId: data.actorId,
      type: data.type,
      data: data.metadata,
    });

    await activity.save();

    // Get followers to notify
    const followers = await this.prisma.follow.findMany({
      where: { followingId: data.actorId },
      select: { followerId: true },
    });

    const followerIds = followers.map((f) => f.followerId);

    // Notify via WebSocket if there are followers
    if (followerIds.length > 0) {
      try {
        // Enrich the activity before sending
        const enrichedActivities = await this.enrichActivities([activity.toObject()]);
        
        if (enrichedActivities.length > 0) {
          await this.feedGateway.notifyNewActivity(followerIds, enrichedActivities[0]);
        }
      } catch (error) {
        console.error('Failed to send WebSocket notification:', error);
        // Don't throw - WebSocket notification failure shouldn't break the flow
      }
    }

    // Invalidate feed caches
    await this.invalidateFeedCaches(data.actorId);

    return activity;
  }

  private async invalidateFeedCaches(userId: string) {
    // Get followers of this user
    const followers = await this.prisma.follow.findMany({
      where: { followingId: userId },
      select: { followerId: true },
    });

    // Invalidate their feed caches
    const deletePromises = followers.map((f) =>
      this.cacheService.del(`feed:${f.followerId}:*`)
    );

    // Also invalidate own cache
    deletePromises.push(this.cacheService.del(`feed:${userId}:*`));

    await Promise.all(deletePromises);
  }

  async getDiscoverFeed(userId: string, page: number = 1, limit: number = 20) {
    /**
     * Discover Feed: Shows popular content from users you don't follow
     * - Recent highly-rated reviews
     * - Trending movies
     * - Active users
     */
    const cacheKey = `discover:${userId}:${page}`;
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    // Get users the current user already follows
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    followingIds.push(userId); // Exclude own content too

    const skip = (page - 1) * limit;

    // Get popular activities from users not followed
    const activities = await this.activityModel
      .find({
        actorId: { $nin: followingIds },
        type: 'review', // Focus on reviews for discover
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1)
      .lean()
      .exec();

    const hasMore = activities.length > limit;
    const items = activities.slice(0, limit);

    const enrichedItems = await this.enrichActivities(items);

    const result = {
      items: enrichedItems,
      hasMore,
      nextPage: hasMore ? page + 1 : null,
    };

    // Cache for 5 minutes (can be stale)
    await this.cacheService.set(cacheKey, result, 300);

    return result;
  }
}