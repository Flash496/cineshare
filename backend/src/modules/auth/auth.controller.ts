// src/modules/auth/auth.controller.ts
import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Get, 
  Request,
  Req,
  Res,
  UsePipes
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from './dto/zod-validation.pipe';
import { registerSchema, loginSchema } from './schemas/auth.schema';
import type { RegisterDto, LoginDto } from './schemas/auth.schema'; // ✅ Use 'import type'
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import { Public } from './decorators/public.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import type { RefreshTokenDto } from './dto/refresh-token.dto'; // ✅ Use 'import type'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  async refresh(
    @GetUser('userId') userId: string,
    @Body() dto: RefreshTokenDto,
  ) {
    return this.authService.refreshTokens(userId, dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@GetUser('userId') userId: string) {
    return this.authService.logout(userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@GetUser('userId') userId: string) {
    return this.authService.validateUser(userId);
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user);
    
    // Redirect to frontend with tokens
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`
    );
  }
}