// backend/src/modules/reviews/reviews.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/create-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { SanitizeReviewPipe } from '../../common/pipes/sanitize-review.pipe';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidationPipe, SanitizeReviewPipe)
  create(
    @GetUser('userId') userId: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(userId, createReviewDto);
  }

  @Public()
  @Get('movie/:movieId')
  findByMovie(
    @Param('movieId', ParseIntPipe) movieId: number,
    @Query(ValidationPipe) query: QueryReviewsDto,
  ) {
    return this.reviewsService.findByMovieFiltered(movieId, query);
  }

  @Public()
  @Get('movie/:movieId/stats')
  getMovieStats(@Param('movieId', ParseIntPipe) movieId: number) {
    return this.reviewsService.getMovieStats(movieId);
  }

  @Public()
  @Get('user/:userId')
  findByUser(
    @Param('userId') userId: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.reviewsService.findByUser(userId, page, limit);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidationPipe, SanitizeReviewPipe)
  update(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(id, userId, updateReviewDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
  ) {
    return this.reviewsService.remove(id, userId);
  }
}