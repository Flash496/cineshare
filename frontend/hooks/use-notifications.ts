// frontend/hooks/use-notifications.ts
'use client';

import { useEffect, useState } from 'react';
import { useSocket } from './use-socket';
import { toast } from 'sonner';

interface Notification {
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

export function useNotifications() {
  const { socketService, isConnected } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isConnected) return;

    const handleNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show toast notification
      toast(notification.message, {
        description: `From ${notification.actorName}`,
        action: {
          label: 'View',
          onClick: () => window.location.href = notification.link,
        },
      });
    };

    socketService.onNotification(handleNotification);

    return () => {
      socketService.offNotification(handleNotification);
    };
  }, [isConnected, socketService]);

  const markAsRead = (notificationId: string) => {
    socketService.markAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    socketService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isConnected,
  };
}