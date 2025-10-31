// backend/src/modules/likes/likes.controller.ts
import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('likes')
@UseGuards(JwtAuthGuard)
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post('reviews/:reviewId')
  async likeReview(
    @Param('reviewId') reviewId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.likesService.likeReview(userId, reviewId);
  }

  @Delete('reviews/:reviewId')
  async unlikeReview(
    @Param('reviewId') reviewId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.likesService.unlikeReview(userId, reviewId);
  }

  @Get('reviews/:reviewId/check')
  async checkLike(
    @Param('reviewId') reviewId: string,
    @GetUser('userId') userId: string,
  ) {
    const hasLiked = await this.likesService.hasUserLikedReview(userId, reviewId);
    return { hasLiked };
  }

  @Get('reviews/:reviewId')
  async getReviewLikes(
    @Param('reviewId') reviewId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.likesService.getReviewLikes(reviewId, page, limit);
  }

  @Get('user/me')
  async getMyLikes(
    @GetUser('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.likesService.getUserLikes(userId, page, limit);
  }

  @Get('user/:userId')
  async getUserLikes(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.likesService.getUserLikes(userId, page, limit);
  }
}