import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordService } from '../../common/services/password.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private passwordService: PasswordService,
  ) {}

  async register(dto: RegisterDto) {
    // Validate password strength
    const passwordValidation = this.passwordService.validatePasswordStrength(dto.password);
    if (!passwordValidation.valid) {
      throw new BadRequestException({
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors,
      });
    }

    // Check if user exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Hash password using PasswordService
    const hashedPassword = await this.passwordService.hash(dto.password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: hashedPassword,
        displayName: dto.displayName || dto.username,
      },
    });

    return { message: 'User registered successfully', userId: user.id };
  }

  async login(dto: LoginDto) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Check if user exists and has a password (not OAuth user)
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password using PasswordService
    const isPasswordValid = await this.passwordService.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT tokens
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    // Store hashed refresh token in database
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: await this.passwordService.hash(refreshToken),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
      },
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access Denied');
    }

    // Verify refresh token using PasswordService
    const refreshTokenMatches = await this.passwordService.compare(
      refreshToken,
      user.refreshToken,
    );

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access Denied');
    }

    // Generate new tokens
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });

    const newRefreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    // Update refresh token in database
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: await this.passwordService.hash(newRefreshToken),
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: 'Logged out successfully' };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async googleLogin(googleUser: any) {
    // Check if user exists with this email
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      // Create new user from Google profile
      const username = googleUser.email.split('@')[0] + '_' + Math.random().toString(36).substring(2, 9);
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          username: username,
          displayName: `${googleUser.firstName} ${googleUser.lastName}`,
          avatar: googleUser.picture,
          provider: 'google',
          isVerified: true, // Google emails are verified
          password: null, // OAuth users don't have passwords
        },
      });
    } else if (user.provider === 'email') {
      // Link Google account to existing email account
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          provider: 'google',
          avatar: googleUser.picture || user.avatar,
        },
      });
    }

    // Generate tokens
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    // Store hashed refresh token in database
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: await this.passwordService.hash(refreshToken),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
      },
    };
  }
}