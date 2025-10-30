// backend/src/modules/watchlist/watchlist.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ValidationPipe,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { CreateWatchlistDto } from './dto/create-watchlist.dto';
import { UpdateWatchlistDto } from './dto/update-watchlist.dto';
import { AddMovieToWatchlistDto } from './dto/add-movie.dto';
import { ReorderMoviesDto } from './dto/reorder-movies.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('watchlists')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @GetUser('userId') userId: string,
    @Body(ValidationPipe) createWatchlistDto: CreateWatchlistDto,
  ) {
    return this.watchlistService.create(userId, createWatchlistDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@GetUser('userId') userId: string) {
    return this.watchlistService.findAll(userId);
  }

  @Public()
  @Get('public')
  getPublicWatchlists(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.watchlistService.getPublicWatchlists(page, limit);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @GetUser('userId') userId: string) {
    return this.watchlistService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @Body(ValidationPipe) updateWatchlistDto: UpdateWatchlistDto,
  ) {
    return this.watchlistService.update(id, userId, updateWatchlistDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @GetUser('userId') userId: string) {
    return this.watchlistService.remove(id, userId);
  }

  @Post(':id/toggle-visibility')
  @UseGuards(JwtAuthGuard)
  toggleVisibility(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
  ) {
    return this.watchlistService.toggleVisibility(id, userId);
  }

  @Post(':id/movies')
  @UseGuards(JwtAuthGuard)
  addMovie(
    @Param('id') watchlistId: string,
    @GetUser('userId') userId: string,
    @Body(ValidationPipe) addMovieDto: AddMovieToWatchlistDto,
  ) {
    return this.watchlistService.addMovie(userId, watchlistId, addMovieDto);
  }

  @Delete(':id/movies/:movieId')
  @UseGuards(JwtAuthGuard)
  removeMovie(
    @Param('id') watchlistId: string,
    @Param('movieId', ParseIntPipe) movieId: number,
    @GetUser('userId') userId: string,
  ) {
    return this.watchlistService.removeMovie(userId, watchlistId, movieId);
  }

  @Patch(':id/movies/:movieId/notes')
  @UseGuards(JwtAuthGuard)
  updateNotes(
    @Param('id') watchlistId: string,
    @Param('movieId', ParseIntPipe) movieId: number,
    @GetUser('userId') userId: string,
    @Body('notes') notes: string,
  ) {
    return this.watchlistService.updateMovieNotes(userId, watchlistId, movieId, notes);
  }

  @Post(':id/movies/:movieId/toggle-watched')
  @UseGuards(JwtAuthGuard)
  toggleWatched(
    @Param('id') watchlistId: string,
    @Param('movieId', ParseIntPipe) movieId: number,
    @GetUser('userId') userId: string,
  ) {
    return this.watchlistService.toggleWatched(userId, watchlistId, movieId);
  }

  @Post(':id/reorder')
  @UseGuards(JwtAuthGuard)
  reorderMovies(
    @Param('id') watchlistId: string,
    @GetUser('userId') userId: string,
    @Body(ValidationPipe) reorderDto: ReorderMoviesDto,
  ) {
    return this.watchlistService.reorderMovies(userId, watchlistId, reorderDto.movies);
  }

  @Get('check-movie/:movieId')
  @UseGuards(JwtAuthGuard)
  checkMovie(
    @Param('movieId', ParseIntPipe) movieId: number,
    @GetUser('userId') userId: string,
  ) {
    return this.watchlistService.getUserWatchlistsForMovie(userId, movieId);
  }
}