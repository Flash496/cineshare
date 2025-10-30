// backend/src/modules/users/users.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ValidationPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get('search')
  searchUsers(
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.usersService.searchUsers(query, limit);
  }

  @Public()
  @Get('top-critics')
  getTopCritics(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.usersService.getTopCritics(limit);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@GetUser('sub') userId: string) {
    return this.usersService.findById(userId);
  }

  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  async getMyStats(@GetUser('sub') userId: string) {
    return this.usersService.getProfileStats(userId);
  }

  @Get('me/activity')
  @UseGuards(JwtAuthGuard)
  getMyActivity(
    @GetUser('sub') userId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.usersService.getRecentActivity(userId, limit);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMyProfile(
    @GetUser('sub') userId: string,
    @Body(ValidationPipe) updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  @Public()
  @Get(':username')
  async getUserProfile(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    return user;
  }

  @Public()
  @Get(':username/stats')
  async getUserStats(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    return this.usersService.getProfileStats(user.id);
  }

  @Public()
  @Get(':username/activity')
  async getUserActivity(
    @Param('username') username: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const user = await this.usersService.findByUsername(username);
    return this.usersService.getRecentActivity(user.id, limit);
  }
}