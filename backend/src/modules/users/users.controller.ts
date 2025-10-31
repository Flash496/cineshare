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
  Request,
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
  async getMyProfile(@Request() req) {
    console.log('📌 getCurrentUser - req.user:', req.user);
    console.log('📌 User ID:', req.user?.id);

    if (!req.user || !req.user.id) {
      console.log('❌ No user ID found in token');
      throw new Error('User not authenticated');
    }

    // ✅ Now this will work because req.user.id is defined!
    const user = await this.usersService.findById(req.user.id);

    if (!user) {
      console.log('❌ User not found in database');
      throw new Error('User not found');
    }

    console.log('✅ User found:', user.username);
    return user;
  }

  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  async getMyStats(@Request() req) {
    console.log('📌 getMyStats - User ID:', req.user?.id);

    if (!req.user || !req.user.id) {
      throw new Error('User not authenticated');
    }

    return this.usersService.getProfileStats(req.user.id);
  }

  @Get('me/activity')
  @UseGuards(JwtAuthGuard)
  async getMyActivity(
    @Request() req,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    console.log('📌 getMyActivity - User ID:', req.user?.id);

    if (!req.user || !req.user.id) {
      throw new Error('User not authenticated');
    }

    return this.usersService.getRecentActivity(req.user.id, limit);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMyProfile(
    @Request() req,
    @Body(ValidationPipe) updateProfileDto: UpdateProfileDto,
  ) {
    console.log('📌 updateMyProfile - User ID:', req.user?.id);

    if (!req.user || !req.user.id) {
      throw new Error('User not authenticated');
    }

    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @Public()
  @Get(':username')
  async getUserProfile(@Param('username') username: string) {
    console.log('📌 getUserProfile - username:', username);
    const user = await this.usersService.findByUsername(username);
    return user;
  }

  @Public()
  @Get(':username/stats')
  async getUserStats(@Param('username') username: string) {
    console.log('📌 getUserStats - username:', username);
    const user = await this.usersService.findByUsername(username);
    return this.usersService.getProfileStats(user.id);
  }

  @Public()
  @Get(':username/activity')
  async getUserActivity(
    @Param('username') username: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    console.log('📌 getUserActivity - username:', username);
    const user = await this.usersService.findByUsername(username);
    return this.usersService.getRecentActivity(user.id, limit);
  }
}
