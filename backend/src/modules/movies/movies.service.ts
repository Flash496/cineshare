// backend/src/modules/movies/movies.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Movie } from '../../schemas/movie.schema';
import { TmdbService } from '../tmdb/tmdb.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MoviesService {
  private readonly logger = new Logger(MoviesService.name);

  constructor(
    @InjectModel(Movie.name) private movieModel: Model<Movie>,
    private readonly tmdbService: TmdbService,
  ) {}

  async findByTmdbId(tmdbId: number): Promise<Movie | null> {
    return this.movieModel.findOne({ tmdbId }).exec();
  }

  async cacheMovie(movieData: any): Promise<Movie> {
    const existingMovie = await this.findByTmdbId(movieData.id);

    if (existingMovie) {
      // Update existing movie
      const updatedMovie = await this.movieModel.findByIdAndUpdate(
        existingMovie._id,
        {
          title: movieData.title,
          originalTitle: movieData.original_title,
          overview: movieData.overview,
          releaseDate: movieData.release_date,
          posterPath: movieData.poster_path,
          backdropPath: movieData.backdrop_path,
          genres: movieData.genres?.map((g) => g.name) || [],
          runtime: movieData.runtime,
          tmdbRating: movieData.vote_average,
          popularity: movieData.popularity,
          cachedAt: new Date(),
        },
        { new: true },
      ).exec();

      // Handle the null case (though it shouldn't happen since we found it above)
      if (!updatedMovie) {
        throw new Error(`Failed to update movie with ID ${existingMovie._id}`);
      }

      return updatedMovie;
    } else {
      // Create new movie
      const movie = new this.movieModel({
        tmdbId: movieData.id,
        title: movieData.title,
        originalTitle: movieData.original_title,
        overview: movieData.overview,
        releaseDate: movieData.release_date,
        posterPath: movieData.poster_path,
        backdropPath: movieData.backdrop_path,
        genres: movieData.genres?.map((g) => g.name) || [],
        runtime: movieData.runtime,
        tmdbRating: movieData.vote_average,
        popularity: movieData.popularity,
      });

      return movie.save();
    }
  }

  // Sync popular movies daily at 2 AM
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async syncPopularMovies() {
    this.logger.log('Starting popular movies sync...');

    try {
      for (let page = 1; page <= 5; page++) {
        const popularMovies = await this.tmdbService.getPopularMovies(page);

        for (const movie of popularMovies.results) {
          await this.cacheMovie(movie);
        }

        // Add delay to respect API rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      this.logger.log('Popular movies sync completed');
    } catch (error) {
      this.logger.error('Failed to sync popular movies:', error);
    }
  }

  // Sync trending movies every 6 hours
  @Cron(CronExpression.EVERY_6_HOURS)
  async syncTrendingMovies() {
    this.logger.log('Starting trending movies sync...');

    try {
      const trendingMovies = await this.tmdbService.getTrendingMovies();

      for (const movie of trendingMovies.results) {
        await this.cacheMovie(movie);
      }

      this.logger.log('Trending movies sync completed');
    } catch (error) {
      this.logger.error('Failed to sync trending movies:', error);
    }
  }
}