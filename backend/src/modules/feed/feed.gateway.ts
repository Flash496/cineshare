// backend/src/modules/feed/feed.gateway.ts
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
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'feed',
})
export class FeedGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map of userId -> Set of socket IDs
  private userSockets = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    
    // Remove socket from userSockets map
    for (const [userId, sockets] of this.userSockets.entries()) {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        
        // Clean up empty sets
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
        
        console.log(`Removed socket ${client.id} from user ${userId}`);
        break;
      }
    }
  }

  @SubscribeMessage('subscribe')
  @UseGuards(WsJwtGuard)
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ) {
    // Initialize set if user doesn't exist
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }

    // Add socket to user's set
    this.userSockets.get(userId)?.add(client.id);
    
    // Join user-specific room
    client.join(`user:${userId}`);
    
    console.log(`User ${userId} subscribed to feed updates via socket ${client.id}`);
    
    return {
      event: 'subscribed',
      data: {
        userId,
        message: 'Successfully subscribed to feed updates',
      },
    };
  }

  @SubscribeMessage('unsubscribe')
  @UseGuards(WsJwtGuard)
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ) {
    // Remove from room
    client.leave(`user:${userId}`);
    
    // Remove from userSockets map
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(client.id);
      
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    
    console.log(`User ${userId} unsubscribed from feed updates`);
    
    return {
      event: 'unsubscribed',
      data: {
        userId,
        message: 'Successfully unsubscribed from feed updates',
      },
    };
  }

  /**
   * Notify specific users about new activity
   */
  async notifyNewActivity(userIds: string[], activity: any) {
    for (const userId of userIds) {
      this.server.to(`user:${userId}`).emit('newActivity', activity);
    }
    
    console.log(`Notified ${userIds.length} users about new activity`);
  }

  /**
   * Notify all connected users about an activity
   */
  async broadcastActivity(activity: any) {
    this.server.emit('newActivity', activity);
    console.log('Broadcasted activity to all connected users');
  }

  /**
   * Get count of connected users
   */
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Check if a user is currently connected
   */
  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }
}