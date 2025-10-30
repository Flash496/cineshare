// backend/src/modules/upload/upload.controller.ts
import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UsersService } from '../users/users.service';

@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly usersService: UsersService,
  ) {}

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @GetUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const avatarUrl = await this.uploadService.uploadImage(file, 'cineshare/avatars');

    // Update user profile with new avatar
    await this.usersService.updateProfile(userId, { avatar: avatarUrl });

    return {
      message: 'Avatar uploaded successfully',
      avatarUrl,
    };
  }
}