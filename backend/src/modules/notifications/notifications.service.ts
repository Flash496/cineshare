// backend/src/modules/notifications/notifications.service.ts
import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationGateway } from '../websocket/notification.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationGateway))
    private notificationGateway: NotificationGateway,
  ) {}

  async createNotification(data: {
    userId: string;
    type: 'like' | 'comment' | 'follow' | 'mention';
    actorId: string;
    referenceId?: string;
    message: string;
    link: string;
  }) {
    // Don't notify if user is notifying themselves
    if (data.userId === data.actorId) {
      return null;
    }

    try {
      // Create notification in database
      const notification = await this.prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          actorId: data.actorId,
          referenceId: data.referenceId,
          message: data.message,
          link: data.link,
          read: false,
        },
        include: {
          actor: {
            select: {
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
      });

      // Send real-time notification if user is online
      try {
        await this.notificationGateway.sendNotification(data.userId, {
          id: notification.id,
          type: notification.type as 'like' | 'comment' | 'follow' | 'mention',
          actorId: notification.actorId,
          actorName: notification.actor.displayName || notification.actor.username,
          actorAvatar: notification.actor.avatar || '',
          message: notification.message,
          link: notification.link,
          createdAt: notification.createdAt,
          read: notification.read,
        });
      } catch (wsError) {
        // Log WebSocket error but don't fail the notification creation
        console.error('Failed to send real-time notification:', wsError);
      }

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  async getNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        include: {
          actor: {
            select: {
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      return null;
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  async deleteNotification(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      return null;
    }

    return this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  async deleteAllRead(userId: string) {
    return this.prisma.notification.deleteMany({
      where: {
        userId,
        read: true,
      },
    });
  }
}