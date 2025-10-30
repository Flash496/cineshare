
// src/modules/websocket/notification.gateway.ts
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

interface NotificationPayload {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  actorId: string;
  actorName: string;
  actorAvatar: string;
  message: string;
  link: string;
  createdAt: Date;
  read: boolean;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // Map of userId -> Set of socket IDs
  private connectedUsers = new Map<string, Set<string>>();

  constructor(private jwtService: JwtService) {}

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
        console.log('No token provided, disconnecting client');
        client.disconnect();
        return;
      }

      // Verify token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'your-fallback-secret-key',
      });
      const userId = payload.sub;

      // Store connection
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)?.add(client.id);

      // Join user's personal room
      client.join(`user:${userId}`);
      client.data.userId = userId;

      console.log(`User ${userId} connected via socket ${client.id}`);

      // Emit connection success
      client.emit('connected', { userId });
    } catch (error) {
      console.error('WebSocket auth error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId && this.connectedUsers.has(userId)) {
      const sockets = this.connectedUsers.get(userId);
      sockets?.delete(client.id);

      if (sockets?.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }

    console.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() notificationId: string,
  ) {
    const userId = client.data.userId;
    // TODO: Update notification as read in database
    console.log(`User ${userId} marked notification ${notificationId} as read`);
    
    return {
      event: 'notificationMarkedAsRead',
      data: { notificationId },
    };
  }

  @SubscribeMessage('markAllAsRead')
  async handleMarkAllAsRead(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    // TODO: Update all notifications as read in database
    console.log(`User ${userId} marked all notifications as read`);
    
    return {
      event: 'allNotificationsMarkedAsRead',
      data: { userId },
    };
  }

  // Server-side methods to send notifications

  /**
   * Send notification to a single user
   */
  async sendNotification(userId: string, notification: NotificationPayload) {
    this.server.to(`user:${userId}`).emit('notification', notification);
    console.log(`Notification sent to user ${userId}`);
  }

  /**
   * Send notification to multiple users
   */
  async sendNotificationToMultiple(
    userIds: string[],
    notification: NotificationPayload,
  ) {
    for (const userId of userIds) {
      this.server.to(`user:${userId}`).emit('notification', notification);
    }
    console.log(`Notification sent to ${userIds.length} users`);
  }

  /**
   * Check if user is currently online
   */
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get list of all online user IDs
   */
  getOnlineUserIds(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Get count of connected users
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }
}
