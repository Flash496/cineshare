// src/modules/reviews/reviews.service.ts
import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException, 
  ConflictException 
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/create-review.dto';
import { QueryReviewsDto, ReviewSortBy } from './dto/query-reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    // Check if user already reviewed this movie
    const existingReview = await this.prisma.review.findUnique({
      where: {
        userId_movieId: {
          userId,
          movieId: dto.movieId,
        },
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this movie');
    }

    return this.prisma.review.create({
      data: {
        userId,
        movieId: dto.movieId,
        rating: dto.rating,
        title: dto.title,
        content: dto.content,
        hasSpoilers: dto.hasSpoilers ?? false,
      },
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
    });
  }

  async findByMovie(movieId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { movieId },
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
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.review.count({
        where: { movieId },
      }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findByMovieFiltered(movieId: number, query: QueryReviewsDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = ReviewSortBy.RECENT,
      minRating,
      maxRating,
      spoilersOnly,
      noSpoilers,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { movieId };

    // Rating filters
    if (minRating !== undefined || maxRating !== undefined) {
      where.rating = {};
      if (minRating !== undefined) where.rating.gte = minRating;
      if (maxRating !== undefined) where.rating.lte = maxRating;
    }

    // Spoiler filters
    if (spoilersOnly) {
      where.hasSpoilers = true;
    } else if (noSpoilers) {
      where.hasSpoilers = false;
    }

    // Build orderBy clause
    let orderBy: any;
    switch (sortBy) {
      case ReviewSortBy.RECENT:
        orderBy = { createdAt: 'desc' };
        break;
      case ReviewSortBy.RATING_HIGH:
        orderBy = { rating: 'desc' };
        break;
      case ReviewSortBy.RATING_LOW:
        orderBy = { rating: 'asc' };
        break;
      case ReviewSortBy.MOST_LIKED:
        orderBy = { likes: { _count: 'desc' } };
        break;
      case ReviewSortBy.MOST_DISCUSSED:
        orderBy = { comments: { _count: 'desc' } };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
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
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    // Calculate rating distribution for filtered results
    const ratingDistribution = await this.prisma.review.groupBy({
      by: ['rating'],
      where,
      _count: { rating: true },
      orderBy: { rating: 'desc' },
    });

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        sortBy,
        minRating,
        maxRating,
        spoilersOnly,
        noSpoilers,
      },
      ratingDistribution: ratingDistribution.map((item) => ({
        rating: item.rating,
        count: item._count.rating,
      })),
    };
  }

  async findByUser(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { userId },
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
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.review.count({
        where: { userId },
      }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
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
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async update(id: string, userId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only edit your own reviews');
    }

    return this.prisma.review.update({
      where: { id },
      data: dto,
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
    });
  }

  async remove(id: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.prisma.review.delete({
      where: { id },
    });

    return { message: 'Review deleted successfully' };
  }

  async updateWithoutCheck(id: string, dto: UpdateReviewDto) {
    return this.prisma.review.update({
      where: { id },
      data: dto,
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
    });
  }

  async removeWithoutCheck(id: string) {
    await this.prisma.review.delete({
      where: { id },
    });

    return { message: 'Review deleted successfully' };
  }

  async getMovieStats(movieId: number) {
    const stats = await this.prisma.review.aggregate({
      where: { movieId },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    const ratingDistribution = await this.prisma.review.groupBy({
      by: ['rating'],
      where: { movieId },
      _count: {
        rating: true,
      },
      orderBy: {
        rating: 'desc',
      },
    });

    return {
      averageRating: stats._avg.rating || 0,
      totalReviews: stats._count.rating || 0,
      ratingDistribution: ratingDistribution.map((item) => ({
        rating: item.rating,
        count: item._count.rating,
      })),
    };
  }

  async getUserReviewForMovie(userId: string, movieId: number) {
    return this.prisma.review.findUnique({
      where: {
        userId_movieId: {
          userId,
          movieId,
        },
      },
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
    });
  }

  async getRecentReviews(limit: number = 10) {
    return this.prisma.review.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
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
    });
  }

  async getTopReviews(movieId: number, limit: number = 5) {
    return this.prisma.review.findMany({
      where: { movieId },
      take: limit,
      orderBy: {
        likes: {
          _count: 'desc',
        },
      },
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
    });
  }
}