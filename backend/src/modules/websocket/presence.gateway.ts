// backend/src/modules/websocket/presence.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Optional } from '@nestjs/common';

interface UserStatus {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'presence',
})
export class PresenceGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // Map of userId -> Set of socket IDs (for multi-device support)
  private userSockets = new Map<string, Set<string>>();
  
  // Map of userId -> status
  private userStatuses = new Map<string, 'online' | 'away'>();
  
  // Map of userId -> last seen timestamp
  private userPresence = new Map<string, {
    status: 'online' | 'away' | 'offline';
    lastSeen: Date;
  }>();

  constructor(
    private jwtService: JwtService,
    @Optional() private redisService?: any, // Optional Redis service
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from auth or headers
      let token = client.handshake.auth.token;

      if (!token) {
        const authHeader = client.handshake.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }

      if (!token) {
        console.log('No token provided for presence, disconnecting');
        client.disconnect();
        return;
      }

      // Verify token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'your-fallback-secret-key',
      });
      const userId = payload.sub;

      // Store socket connection
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      // Set status to online
      this.userStatuses.set(userId, 'online');
      this.userPresence.set(userId, {
        status: 'online',
        lastSeen: new Date(),
      });

      // Store in Redis if available
      if (this.redisService) {
        await this.setUserStatusInRedis(userId, 'online');
      }

      // Store userId in socket data
      client.data.userId = userId;
      client.join(`user:${userId}`);

      // Broadcast online status
      await this.broadcastUserStatus(userId, 'online');

      console.log(`User ${userId} is now online (socket: ${client.id})`);
    } catch (error) {
      console.error('Presence auth error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId && this.userSockets.has(userId)) {
      const sockets = this.userSockets.get(userId)!;
      sockets.delete(client.id);

      // If no more connections for this user, set to offline
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
        this.userStatuses.delete(userId);
        this.userPresence.set(userId, {
          status: 'offline',
          lastSeen: new Date(),
        });

        // Update Redis if available
        if (this.redisService) {
          await this.setUserStatusInRedis(userId, 'offline');
        }

        // Broadcast offline status
        await this.broadcastUserStatus(userId, 'offline');

        console.log(`User ${userId} is now offline`);
      } else {
        console.log(`User ${userId} disconnected socket ${client.id}, but still has ${sockets.size} active connection(s)`);
      }
    }
  }

  @SubscribeMessage('updateStatus')
  async handleUpdateStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() status: 'online' | 'away',
  ) {
    const userId = client.data.userId;

    if (!userId) return;

    this.userStatuses.set(userId, status);
    this.userPresence.set(userId, {
      status,
      lastSeen: new Date(),
    });

    if (this.redisService) {
      await this.setUserStatusInRedis(userId, status);
    }

    await this.broadcastUserStatus(userId, status);

    return {
      event: 'statusUpdated',
      data: { userId, status },
    };
  }

  @SubscribeMessage('checkUsersStatus')
  async handleCheckUsersStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() userIds: string[],
  ) {
    const statuses = await Promise.all(
      userIds.map(async (userId) => ({
        userId,
        status: await this.getUserStatus(userId),
        lastSeen: this.userPresence.get(userId)?.lastSeen || new Date(),
      }))
    );

    client.emit('usersStatus', statuses);
    
    return {
      event: 'usersStatus',
      data: statuses,
    };
  }

  @SubscribeMessage('getOnlineUsers')
  async handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    const onlineUsers = this.getOnlineUsers();
    
    client.emit('onlineUsersList', onlineUsers);
    
    return {
      event: 'onlineUsersList',
      data: onlineUsers,
    };
  }

  /**
   * Broadcast user status change to all connected clients
   */
  private async broadcastUserStatus(
    userId: string,
    status: 'online' | 'away' | 'offline',
  ) {
    this.server.emit('presenceChange', {
      userId,
      status,
      timestamp: new Date(),
    });
  }

  /**
   * Store user status in Redis with TTL
   */
  private async setUserStatusInRedis(
    userId: string,
    status: 'online' | 'away' | 'offline',
  ) {
    if (!this.redisService) return;

    try {
      const key = `user:status:${userId}`;
      await this.redisService.set(
        key,
        JSON.stringify({
          status,
          lastSeen: new Date(),
        }),
        300, // 5 minutes TTL
      );
    } catch (error) {
      console.error('Failed to set user status in Redis:', error);
    }
  }

  /**
   * Get user status - checks in-memory first, then Redis
   */
  async getUserStatus(userId: string): Promise<'online' | 'away' | 'offline'> {
    // Check in-memory first (fastest)
    if (this.userSockets.has(userId)) {
      return this.userStatuses.get(userId) || 'online';
    }

    // Check Redis if available
    if (this.redisService) {
      try {
        const key = `user:status:${userId}`;
        const cached = await this.redisService.get(key);
        if (cached) {
          const data = JSON.parse(cached);
          return data.status;
        }
      } catch (error) {
        console.error('Failed to get user status from Redis:', error);
      }
    }

    // Check in-memory presence map
    const presence = this.userPresence.get(userId);
    if (presence) {
      return presence.status;
    }

    return 'offline';
  }

  /**
   * Get user presence with last seen
   */
  getUserPresence(userId: string) {
    return this.userPresence.get(userId) || {
      status: 'offline' as const,
      lastSeen: new Date(),
    };
  }

  /**
   * Check if user is currently online
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  /**
   * Get all online users
   */
  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  /**
   * Get all users with their status
   */
  getAllUsersStatus(): UserStatus[] {
    const statuses: UserStatus[] = [];
    
    for (const [userId, presence] of this.userPresence.entries()) {
      statuses.push({
        userId,
        status: presence.status,
        lastSeen: presence.lastSeen,
      });
    }
    
    return statuses;
  }

  /**
   * Get count of online users
   */
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Get count of users by status
   */
  getUserCountByStatus(): {
    online: number;
    away: number;
    offline: number;
  } {
    let online = 0;
    let away = 0;
    let offline = 0;

    for (const presence of this.userPresence.values()) {
      if (presence.status === 'online') online++;
      else if (presence.status === 'away') away++;
      else offline++;
    }

    return { online, away, offline };
  }
}