// backend/src/modules/social/social.controller.ts
import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post('follow/:userId')
  @UseGuards(JwtAuthGuard)
  followUser(
    @GetUser('userId') followerId: string,
    @Param('userId') followingId: string,
  ) {
    return this.socialService.followUser(followerId, followingId);
  }

  @Delete('unfollow/:userId')
  @UseGuards(JwtAuthGuard)
  unfollowUser(
    @GetUser('userId') followerId: string,
    @Param('userId') followingId: string,
  ) {
    return this.socialService.unfollowUser(followerId, followingId);
  }

  @Get('followers/:userId')
  getFollowers(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.socialService.getFollowers(userId, page, limit);
  }

  @Get('following/:userId')
  getFollowing(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.socialService.getFollowing(userId, page, limit);
  }

  @Get('is-following/:userId')
  @UseGuards(JwtAuthGuard)
  isFollowing(
    @GetUser('userId') followerId: string,
    @Param('userId') followingId: string,
  ) {
    return this.socialService.isFollowing(followerId, followingId);
  }

  @Get('suggested')
  @UseGuards(JwtAuthGuard)
  getSuggestedUsers(
    @GetUser('userId') userId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.socialService.getSuggestedUsers(userId, limit);
  }
}