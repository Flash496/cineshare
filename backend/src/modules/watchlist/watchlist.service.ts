// backend/src/modules/watchlist/watchlist.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWatchlistDto } from './dto/create-watchlist.dto';
import { UpdateWatchlistDto } from './dto/update-watchlist.dto';
import { AddMovieToWatchlistDto } from './dto/add-movie.dto';

@Injectable()
export class WatchlistService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateWatchlistDto) {
    return this.prisma.watchlist.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        isPublic: dto.isPublic ?? true,
      },
      include: {
        _count: {
          select: { movies: true },
        },
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.watchlist.findMany({
      where: { userId },
      include: {
        _count: {
          select: { movies: true },
        },
        movies: {
          take: 4, // Preview of first 4 movies
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, requestingUserId?: string) {
    const watchlist = await this.prisma.watchlist.findUnique({
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
        movies: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { movies: true },
        },
      },
    });

    if (!watchlist) {
      throw new NotFoundException('Watchlist not found');
    }

    // Check if watchlist is private and user is not the owner
    if (!watchlist.isPublic && watchlist.userId !== requestingUserId) {
      throw new ForbiddenException('This watchlist is private');
    }

    return watchlist;
  }

  async update(id: string, userId: string, dto: UpdateWatchlistDto) {
    const watchlist = await this.prisma.watchlist.findUnique({
      where: { id },
    });

    if (!watchlist) {
      throw new NotFoundException('Watchlist not found');
    }

    if (watchlist.userId !== userId) {
      throw new ForbiddenException('You can only update your own watchlists');
    }

    return this.prisma.watchlist.update({
      where: { id },
      data: dto,
      include: {
        _count: {
          select: { movies: true },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const watchlist = await this.prisma.watchlist.findUnique({
      where: { id },
    });

    if (!watchlist) {
      throw new NotFoundException('Watchlist not found');
    }

    if (watchlist.userId !== userId) {
      throw new ForbiddenException('You can only delete your own watchlists');
    }

    await this.prisma.watchlist.delete({
      where: { id },
    });

    return { message: 'Watchlist deleted successfully' };
  }

  async toggleVisibility(id: string, userId: string) {
    const watchlist = await this.prisma.watchlist.findUnique({
      where: { id },
    });

    if (!watchlist) {
      throw new NotFoundException('Watchlist not found');
    }

    if (watchlist.userId !== userId) {
      throw new ForbiddenException('You can only modify your own watchlists');
    }

    return this.prisma.watchlist.update({
      where: { id },
      data: {
        isPublic: !watchlist.isPublic,
      },
      include: {
        _count: {
          select: { movies: true },
        },
      },
    });
  }

  async addMovie(userId: string, watchlistId: string, dto: AddMovieToWatchlistDto) {
    // Verify watchlist ownership
    const watchlist = await this.prisma.watchlist.findUnique({
      where: { id: watchlistId },
      include: {
        movies: {
          orderBy: { order: 'desc' },
          take: 1,
        },
      },
    });

    if (!watchlist) {
      throw new NotFoundException('Watchlist not found');
    }

    if (watchlist.userId !== userId) {
      throw new ForbiddenException('You can only add movies to your own watchlists');
    }

    // Check if movie already in watchlist
    const existing = await this.prisma.watchlistMovie.findUnique({
      where: {
        watchlistId_movieId: {
          watchlistId,
          movieId: dto.movieId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Movie already in this watchlist');
    }

    // Get next order number
    const maxOrder = watchlist.movies[0]?.order ?? 0;

    // Add movie
    const watchlistMovie = await this.prisma.watchlistMovie.create({
      data: {
        watchlistId,
        movieId: dto.movieId,
        notes: dto.notes,
        watched: dto.watched ?? false,
        order: maxOrder + 1,
      },
    });

    return {
      message: 'Movie added to watchlist',
      movie: watchlistMovie,
    };
  }

  async removeMovie(userId: string, watchlistId: string, movieId: number) {
    // Verify watchlist ownership
    const watchlist = await this.prisma.watchlist.findUnique({
      where: { id: watchlistId },
    });

    if (!watchlist) {
      throw new NotFoundException('Watchlist not found');
    }

    if (watchlist.userId !== userId) {
      throw new ForbiddenException('You can only remove movies from your own watchlists');
    }

    // Check if movie is in watchlist
    const watchlistMovie = await this.prisma.watchlistMovie.findUnique({
      where: {
        watchlistId_movieId: {
          watchlistId,
          movieId,
        },
      },
    });

    if (!watchlistMovie) {
      throw new NotFoundException('Movie not found in this watchlist');
    }

    await this.prisma.watchlistMovie.delete({
      where: {
        watchlistId_movieId: {
          watchlistId,
          movieId,
        },
      },
    });

    return { message: 'Movie removed from watchlist' };
  }

  async updateMovieNotes(
    userId: string,
    watchlistId: string,
    movieId: number,
    notes: string,
  ) {
    // Verify ownership
    const watchlist = await this.prisma.watchlist.findUnique({
      where: { id: watchlistId },
    });

    if (!watchlist || watchlist.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.watchlistMovie.update({
      where: {
        watchlistId_movieId: {
          watchlistId,
          movieId,
        },
      },
      data: { notes },
    });
  }

  async toggleWatched(userId: string, watchlistId: string, movieId: number) {
    // Verify ownership
    const watchlist = await this.prisma.watchlist.findUnique({
      where: { id: watchlistId },
    });

    if (!watchlist || watchlist.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const watchlistMovie = await this.prisma.watchlistMovie.findUnique({
      where: {
        watchlistId_movieId: {
          watchlistId,
          movieId,
        },
      },
    });

    if (!watchlistMovie) {
      throw new NotFoundException('Movie not found in watchlist');
    }

    return this.prisma.watchlistMovie.update({
      where: {
        watchlistId_movieId: {
          watchlistId,
          movieId,
        },
      },
      data: {
        watched: !watchlistMovie.watched,
      },
    });
  }

  async reorderMovies(
    userId: string,
    watchlistId: string,
    movieOrders: Array<{ movieId: number; order: number }>,
  ) {
    // Verify ownership
    const watchlist = await this.prisma.watchlist.findUnique({
      where: { id: watchlistId },
    });

    if (!watchlist) {
      throw new NotFoundException('Watchlist not found');
    }

    if (watchlist.userId !== userId) {
      throw new ForbiddenException('You can only reorder your own watchlists');
    }

    // Validate all movies exist in watchlist
    const existingMovies = await this.prisma.watchlistMovie.findMany({
      where: {
        watchlistId,
        movieId: { in: movieOrders.map((m) => m.movieId) },
      },
    });

    if (existingMovies.length !== movieOrders.length) {
      throw new BadRequestException('Some movies not found in watchlist');
    }

    // Update orders in transaction
    await this.prisma.$transaction(
      movieOrders.map(({ movieId, order }) =>
        this.prisma.watchlistMovie.update({
          where: {
            watchlistId_movieId: {
              watchlistId,
              movieId,
            },
          },
          data: { order },
        }),
      ),
    );

    return { message: 'Watchlist reordered successfully' };
  }

  async getUserWatchlistsForMovie(userId: string, movieId: number) {
    const watchlists = await this.prisma.watchlist.findMany({
      where: { userId },
      include: {
        movies: {
          where: { movieId },
        },
      },
    });

    return watchlists.map((w) => ({
      id: w.id,
      name: w.name,
      hasMovie: w.movies.length > 0,
    }));
  }

  async getUserWatchlists(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [watchlists, total] = await Promise.all([
      this.prisma.watchlist.findMany({
        where: { userId },
        include: {
          _count: {
            select: { movies: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.watchlist.count({
        where: { userId },
      }),
    ]);

    return {
      watchlists,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getPublicWatchlists(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [watchlists, total] = await Promise.all([
      this.prisma.watchlist.findMany({
        where: { isPublic: true },
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
            select: { movies: true },
          },
          movies: {
            take: 4,
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.watchlist.count({ where: { isPublic: true } }),
    ]);

    return {
      watchlists,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}