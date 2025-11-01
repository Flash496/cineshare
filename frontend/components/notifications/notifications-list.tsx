// frontend/components/notifications/notifications-list.tsx
'use client';

import { useEffect, useState } from 'react';
import { NotificationItem } from './notification-item';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCheck, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSocket } from '@/hooks/use-socket';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  actorId: string;
  actorName: string;
  actorAvatar: string;
  message: string;
  link: string;
  createdAt: string;
  read: boolean;
}

export function NotificationsList() {
  const { user } = useAuth();
  const socketService = useSocket();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    if (!user || !socketService) return;

    // Listen for new notifications
    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
    };

    socketService.onNotification(handleNewNotification);

    return () => {
      socketService.offNotification(handleNewNotification);
    };
  }, [user, socketService]);

  const fetchNotifications = async (pageNum: number = 1) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const response = await fetch(
        `${API_URL}/notifications?page=${pageNum}&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (pageNum === 1) {
          setNotifications(data.notifications);
        } else {
          setNotifications((prev) => [...prev, ...data.notifications]);
        }

        setHasMore(data.pagination.page < data.pagination.pages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      await fetch(`${API_URL}/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

      if (socketService) {
        socketService.markAllAsRead();
      }

      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );

      if (socketService) {
        socketService.markAsRead(notificationId);
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      await fetch(`${API_URL}/notifications/read/all`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((prev) => prev.filter((n) => !n.read));
      toast.success('Read notifications deleted');
    } catch (error) {
      console.error('Failed to delete read notifications:', error);
      toast.error('Failed to delete notifications');
    }
  };

  const loadMore = () => {
    fetchNotifications(page + 1);
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please sign in to view notifications</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!loading && notifications.length === 0) {
    return <div className="p-6 text-muted-foreground text-center">No notifications yet.</div>;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount = notifications.filter((n) => n.read).length;

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between gap-2 pb-4 border-b">
          <div className="text-sm text-muted-foreground">
            {unreadCount > 0 && <span>{unreadCount} unread</span>}
            {unreadCount > 0 && readCount > 0 && <span> • </span>}
            {readCount > 0 && <span>{readCount} read</span>}
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                className="gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
            )}
            {readCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteAllRead}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear read
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="border rounded-lg overflow-hidden">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={handleMarkAsRead}
            onClose={() => {}}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}