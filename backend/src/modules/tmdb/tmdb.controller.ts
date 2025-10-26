// backend/src/modules/tmdb/tmdb.controller.ts
import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  BadRequestException,
  DefaultValuePipe,
} from '@nestjs/common';
import { TmdbService } from './tmdb.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('tmdb')
@Public() // ✅ Make all TMDB endpoints public
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

  @Get('search')
  async searchMovies(
    @Query('q') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    if (!query || query.trim() === '') {
      throw new BadRequestException('Search query is required');
    }

    return this.tmdbService.searchMovies(query.trim(), page);
  }

  @Get('trending')
  async getTrendingMovies(
    @Query('time_window', new DefaultValuePipe('week')) timeWindow: 'day' | 'week',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    if (timeWindow !== 'day' && timeWindow !== 'week') {
      throw new BadRequestException('time_window must be either "day" or "week"');
    }

    return this.tmdbService.getTrendingMovies(timeWindow, page);
  }

  @Get('popular')
  async getPopularMovies(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.tmdbService.getPopularMovies(page);
  }

  @Get('top-rated')
  async getTopRatedMovies(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.tmdbService.getTopRatedMovies(page);
  }

  @Get('upcoming')
  async getUpcomingMovies(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.tmdbService.getUpcomingMovies(page);
  }

  @Get('now-playing')
  async getNowPlayingMovies(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.tmdbService.getNowPlayingMovies(page);
  }

  @Get('genres')
  async getGenres() {
    return this.tmdbService.getGenres();
  }

  @Get('discover')
  async discoverMovies(
    @Query('genre', new ParseIntPipe({ optional: true })) genre?: number,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
    @Query('sort_by') sortBy?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('vote_average', new ParseIntPipe({ optional: true })) voteAverage?: number,
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

  // ⚠️ CRITICAL: Routes with :id/something MUST come BEFORE :id alone
  @Get(':id/recommendations')
  async getMovieRecommendations(
    @Param('id', ParseIntPipe) id: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.tmdbService.getMovieRecommendations(id, page);
  }

  @Get(':id/similar')
  async getSimilarMovies(
    @Param('id', ParseIntPipe) id: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
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

  // ✅ This MUST be LAST - catches /tmdb/:id
  @Get(':id')
  async getMovieDetails(@Param('id', ParseIntPipe) id: number) {
    return this.tmdbService.getMovieDetails(id);
  }
}