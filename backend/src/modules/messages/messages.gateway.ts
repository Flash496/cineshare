// backend/src/modules/messages/messages.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from './messages.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'messages',
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Set<string>>();

  constructor(
    private messagesService: MessagesService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token
      let token = client.handshake.auth.token;

      if (!token) {
        const authHeader = client.handshake.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }

      if (!token) {
        console.log('No token provided for messages, disconnecting');
        client.disconnect();
        return;
      }

      // Verify token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'your-fallback-secret-key',
      });
      const userId = payload.sub;

      // Store connection
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      // Store userId in socket data
      client.data.userId = userId;

      // Join user's personal room
      client.join(`user:${userId}`);

      console.log(`User ${userId} connected to messages (socket: ${client.id})`);

      // Emit connection success
      client.emit('connected', { userId });
    } catch (error) {
      console.error('Messages gateway auth error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId && this.userSockets.has(userId)) {
      const sockets = this.userSockets.get(userId)!;
      sockets.delete(client.id);

      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    console.log(`Client ${client.id} disconnected from messages`);
  }

  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    client.join(`conversation:${conversationId}`);
    console.log(`User ${client.data.userId} joined conversation ${conversationId}`);
    
    return {
      event: 'conversationJoined',
      data: { conversationId },
    };
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    client.leave(`conversation:${conversationId}`);
    console.log(`User ${client.data.userId} left conversation ${conversationId}`);
    
    return {
      event: 'conversationLeft',
      data: { conversationId },
    };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { recipientId: string; content: string },
  ) {
    try {
      const senderId = client.data.userId;

      if (!senderId) {
        return {
          event: 'error',
          data: { message: 'Not authenticated' },
        };
      }

      const message = await this.messagesService.sendMessage(
        senderId,
        data.recipientId,
        data.content,
      );

      const conversation = await this.messagesService.getOrCreateConversation(
        senderId,
        data.recipientId,
      );

      // Emit to conversation room
      this.server
        .to(`conversation:${conversation.id}`)
        .emit('newMessage', message);

      // Also emit to recipient's personal room for notification
      this.server.to(`user:${data.recipientId}`).emit('newMessageNotification', {
        conversationId: conversation.id,
        message,
      });

      return {
        event: 'messageSent',
        data: message,
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        event: 'error',
        data: { message: 'Failed to send message' },
      };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    const userId = client.data.userId;

    if (!userId) return;

    // Emit to others in the conversation
    client.to(`conversation:${data.conversationId}`).emit('userTyping', {
      userId,
      isTyping: data.isTyping,
    });

    return {
      event: 'typingStatusSent',
      data: { conversationId: data.conversationId, isTyping: data.isTyping },
    };
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    try {
      const userId = client.data.userId;

      if (!userId) return;

      await this.messagesService.markAsRead(conversationId, userId);

      // Notify other participants
      client.to(`conversation:${conversationId}`).emit('messagesRead', {
        conversationId,
        userId,
      });

      return {
        event: 'markedAsRead',
        data: { conversationId },
      };
    } catch (error) {
      console.error('Error marking as read:', error);
      return {
        event: 'error',
        data: { message: 'Failed to mark as read' },
      };
    }
  }

  /**
   * Send message notification to a user
   */
  async sendMessageNotification(userId: string, data: any) {
    this.server.to(`user:${userId}`).emit('newMessageNotification', data);
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }
}