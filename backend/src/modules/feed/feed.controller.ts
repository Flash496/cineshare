// backend/src/modules/feed/feed.controller.ts
import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { FeedService } from './feed.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getFeed(
    @GetUser('userId') userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.feedService.generateFeed(
      userId,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  @Get('discover')
  @UseGuards(JwtAuthGuard)
  async getDiscoverFeed(
    @GetUser('userId') userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.feedService.getDiscoverFeed(
      userId,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }
}