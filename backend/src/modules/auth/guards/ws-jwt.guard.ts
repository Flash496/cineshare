// backend/src/modules/auth/guards/ws-jwt.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const token = this.extractTokenFromHandshake(client);

      if (!token) {
        throw new WsException('Missing authentication token');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'your-fallback-secret-key',
      });

      // Attach user to socket data for later use
      client.data.user = {
        userId: payload.sub,
        email: payload.email,
        username: payload.username,
      };

      return true;
    } catch (error) {
      throw new WsException('Invalid or expired token');
    }
  }

  private extractTokenFromHandshake(client: Socket): string | null {
    // Try to get token from auth header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try to get token from query parameters (fallback)
    const tokenFromQuery = client.handshake.auth?.token || client.handshake.query?.token;
    if (tokenFromQuery) {
      return Array.isArray(tokenFromQuery) ? tokenFromQuery[0] : tokenFromQuery;
    }

    return null;
  }
}