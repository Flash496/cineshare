// frontend/components/notifications/notification-item.tsx
'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, UserPlus, AtSign } from 'lucide-react';

interface NotificationItemProps {
  notification: {
    id: string;
    type: 'like' | 'comment' | 'follow' | 'mention';
    actorName: string;
    actorAvatar: string;
    message: string;
    link: string;
    createdAt: string;
    read: boolean;
  };
  onMarkAsRead: (id: string) => void;
  onClose: () => void;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onClose,
}: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    onClose();
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'mention':
        return <AtSign className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <Link
      href={notification.link}
      onClick={handleClick}
      className={cn(
        'block p-3 hover:bg-muted transition-colors border-b last:border-b-0',
        !notification.read && 'bg-blue-50 dark:bg-blue-950/20'
      )}
    >
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={notification.actorAvatar} />
          <AvatarFallback>{notification.actorName[0]}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm">
              <span className="font-semibold">{notification.actorName}</span>{' '}
              {notification.message}
            </p>
            {getIcon()}
          </div>

          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </p>

          {!notification.read && (
            <div className="mt-2">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}