// backend/src/modules/users/users.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Get current user profile (authenticated)
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@GetUser('sub') userId: string) {
    return this.usersService.findById(userId);
  }

  // Get user by ID (public)
  @Public()
  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  // Get user by username (public)
  @Public()
  @Get('username/:username')
  getUserByUsername(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  // Get user review stats (public)
  @Public()
  @Get(':id/stats')
  getUserStats(@Param('id') id: string) {
    return this.usersService.getUserReviewStats(id);
  }

  // Update current user profile (authenticated)
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @GetUser('sub') userId: string,
    @Body(ValidationPipe) updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, updateProfileDto);
  }
}