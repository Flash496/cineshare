// backend/src/modules/comments/comments.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // Create comment - requires auth
  @Post('reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Param('reviewId') reviewId: string,
    @GetUser('userId') userId: string,
    @Body(ValidationPipe) createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(
      userId,
      reviewId,
      createCommentDto.content,
      createCommentDto.parentId,
    );
  }

  // Get comments for a review - public
  @Public()
  @Get('reviews/:reviewId')
  async getReviewComments(
    @Param('reviewId') reviewId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.commentsService.findByReview(reviewId, page, limit);
  }

  // Get comment count - public
  @Public()
  @Get('reviews/:reviewId/count')
  async getCommentCount(@Param('reviewId') reviewId: string) {
    const count = await this.commentsService.getCommentCount(reviewId);
    return { count };
  }

  // Get replies for a comment - public
  @Public()
  @Get(':id/replies')
  async getReplies(
    @Param('id') parentId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.commentsService.getReplies(parentId, page, limit);
  }

  // Get current user's comments - requires auth
  @Get('user/me')
  @UseGuards(JwtAuthGuard)
  async getMyComments(
    @GetUser('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.commentsService.findByUser(userId, page, limit);
  }

  // Get user's comments by userId - public
  @Public()
  @Get('user/:userId')
  async getUserComments(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.commentsService.findByUser(userId, page, limit);
  }

  // Get single comment - public
  @Public()
  @Get(':id')
  async getComment(@Param('id') id: string) {
    return this.commentsService.findOne(id);
  }

  // Update comment - requires auth
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateComment(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @Body(ValidationPipe) updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, userId, updateCommentDto.content);
  }

  // Delete comment - requires auth
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteComment(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
  ) {
    return this.commentsService.remove(id, userId);
  }
}