// frontend/lib/socket.ts
import { io, Socket } from 'socket.io-client';

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

class SocketService {
  private sockets: {
    notifications?: Socket;
    presence?: Socket;
    feed?: Socket;
  } = {};

  connect(token: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Notification socket
    this.sockets.notifications = io(`${apiUrl}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.sockets.notifications.on('connect', () => {
      console.log('Notification socket connected');
    });

    this.sockets.notifications.on('disconnect', () => {
      console.log('Notification socket disconnected');
    });

    this.sockets.notifications.on('connect_error', (error) => {
      console.error('Notification socket connection error:', error);
    });

    // Presence socket
    this.sockets.presence = io(`${apiUrl}/presence`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.sockets.presence.on('connect', () => {
      console.log('Presence socket connected');
    });

    this.sockets.presence.on('disconnect', () => {
      console.log('Presence socket disconnected');
    });

    // Feed socket
    this.sockets.feed = io(`${apiUrl}/feed`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.sockets.feed.on('connect', () => {
      console.log('Feed socket connected');
    });

    this.sockets.feed.on('disconnect', () => {
      console.log('Feed socket disconnected');
    });

    return this.sockets;
  }

  getSocket() {
    return this.sockets;
  }

  disconnect() {
    this.sockets.notifications?.disconnect();
    this.sockets.presence?.disconnect();
    this.sockets.feed?.disconnect();
    
    this.sockets = {};
  }

  // Notification methods
  onNotification(callback: (notification: NotificationPayload) => void) {
    this.sockets.notifications?.on('notification', callback);
  }

  offNotification(callback?: (notification: NotificationPayload) => void) {
    if (callback) {
      this.sockets.notifications?.off('notification', callback);
    } else {
      this.sockets.notifications?.off('notification');
    }
  }

  markAsRead(notificationId: string) {
    this.sockets.notifications?.emit('markAsRead', notificationId);
  }

  markAllAsRead() {
    this.sockets.notifications?.emit('markAllAsRead');
  }

  // Presence methods
  updateStatus(status: 'online' | 'away') {
    this.sockets.presence?.emit('updateStatus', status);
  }

  onPresenceChange(callback: (data: { userId: string; status: string }) => void) {
    this.sockets.presence?.on('presenceChange', callback);
  }

  offPresenceChange(callback?: (data: { userId: string; status: string }) => void) {
    if (callback) {
      this.sockets.presence?.off('presenceChange', callback);
    } else {
      this.sockets.presence?.off('presenceChange');
    }
  }

  // Feed methods
  subscribeFeed(userId: string) {
    this.sockets.feed?.emit('subscribe', userId);
  }

  onNewActivity(callback: (activity: any) => void) {
    this.sockets.feed?.on('newActivity', callback);
  }

  offNewActivity(callback?: (activity: any) => void) {
    if (callback) {
      this.sockets.feed?.off('newActivity', callback);
    } else {
      this.sockets.feed?.off('newActivity');
    }
  }

  // Connection status
  isConnected(): boolean {
    return (
      this.sockets.notifications?.connected === true ||
      this.sockets.presence?.connected === true ||
      this.sockets.feed?.connected === true
    );
  }

  getNotificationSocket(): Socket | null {
    return this.sockets.notifications || null;
  }

  getPresenceSocket(): Socket | null {
    return this.sockets.presence || null;
  }

  getFeedSocket(): Socket | null {
    return this.sockets.feed || null;
  }
}

export const socketService = new SocketService();