// backend/src/modules/movies/movies.controller.ts
import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { TmdbService } from '../tmdb/tmdb.service';
import { MoviesService } from './movies.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('movies')
@Public() // Makes all movie endpoints public
export class MoviesController {
  constructor(
    private readonly tmdbService: TmdbService,
    private readonly moviesService: MoviesService,
  ) {}

  @Get('search')
  async searchMovies(
    @Query('q') query: string,
    @Query('page') page?: number,
  ) {
    return this.tmdbService.searchMovies(query, page);
  }

  @Get('trending')
  async getTrendingMovies(
    @Query('timeWindow') timeWindow?: 'day' | 'week',
    @Query('page') page?: number,
  ) {
    return this.tmdbService.getTrendingMovies(timeWindow, page);
  }

  @Get('popular')
  async getPopularMovies(@Query('page') page?: number) {
    return this.tmdbService.getPopularMovies(page);
  }

  @Get('top-rated')
  async getTopRatedMovies(@Query('page') page?: number) {
    return this.tmdbService.getTopRatedMovies(page);
  }

  @Get('upcoming')
  async getUpcomingMovies(@Query('page') page?: number) {
    return this.tmdbService.getUpcomingMovies(page);
  }

  @Get('now-playing')
  async getNowPlayingMovies(@Query('page') page?: number) {
    return this.tmdbService.getNowPlayingMovies(page);
  }

  @Get('genres')
  async getGenres() {
    return this.tmdbService.getGenres();
  }

  @Get('discover')
  async discoverMovies(
    @Query('genre') genre?: number,
    @Query('year') year?: number,
    @Query('sortBy') sortBy?: string,
    @Query('page') page?: number,
    @Query('voteAverage') voteAverage?: number,
    @Query('language') language?: string,
  ) {
    return this.tmdbService.discoverMovies({
      genre,
      year,
      sortBy,
      page,
      voteAverage,
      language,
    });
  }

  @Get(':id')
  async getMovieDetails(@Param('id', ParseIntPipe) id: number) {
    // First try to get from cache/database
    const cachedMovie = await this.moviesService.findByTmdbId(id);
    if (cachedMovie) {
      return cachedMovie;
    }

    // If not cached, fetch from TMDB and cache it
    const movieData = await this.tmdbService.getMovieDetails(id);
    await this.moviesService.cacheMovie(movieData);
    
    return movieData;
  }

  @Get(':id/reviews')
  async getMovieReviews(@Param('id', ParseIntPipe) id: number) {
    const movieDetails = await this.tmdbService.getMovieDetails(id);
    return movieDetails.reviews || { results: [] };
  }

  @Get(':id/recommendations')
  async getMovieRecommendations(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: number,
  ) {
    return this.tmdbService.getMovieRecommendations(id, page);
  }

  @Get(':id/similar')
  async getSimilarMovies(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: number,
  ) {
    return this.tmdbService.getSimilarMovies(id, page);
  }

  @Get(':id/credits')
  async getMovieCredits(@Param('id', ParseIntPipe) id: number) {
    return this.tmdbService.getMovieCredits(id);
  }

  @Get(':id/videos')
  async getMovieVideos(@Param('id', ParseIntPipe) id: number) {
    return this.tmdbService.getMovieVideos(id);
  }
}