// frontend/hooks/use-presence.ts
'use client';

import { useEffect, useState } from 'react';
import { useSocket } from './use-socket';
import { useAuth } from './use-auth';

interface UserStatus {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: Date;
}

export function usePresence(userIds: string[]) {
  const { user } = useAuth();
  const { socketService } = useSocket();
  const [statuses, setStatuses] = useState<Map<string, UserStatus>>(new Map());

  useEffect(() => {
    if (!user || userIds.length === 0 || !socketService) return;

    const presenceSocket = socketService.getPresenceSocket();
    if (!presenceSocket || !presenceSocket.connected) return;

    // Request initial statuses
    presenceSocket.emit('checkUsersStatus', userIds);

    // Listen for status updates
    const handleStatusUpdate = (data: UserStatus & { timestamp: Date }) => {
      if (userIds.includes(data.userId)) {
        setStatuses((prev) => {
          const next = new Map(prev);
          next.set(data.userId, data);
          return next;
        });
      }
    };

    const handleUsersStatus = (data: UserStatus[]) => {
      setStatuses((prev) => {
        const next = new Map(prev);
        data.forEach((status) => {
          next.set(status.userId, status);
        });
        return next;
      });
    };

    const handlePresenceChange = (data: { userId: string; status: 'online' | 'away' | 'offline'; timestamp: Date }) => {
      if (userIds.includes(data.userId)) {
        setStatuses((prev) => {
          const next = new Map(prev);
          next.set(data.userId, {
            userId: data.userId,
            status: data.status,
            lastSeen: data.timestamp,
          });
          return next;
        });
      }
    };

    presenceSocket.on('userStatusUpdate', handleStatusUpdate);
    presenceSocket.on('usersStatus', handleUsersStatus);
    presenceSocket.on('presenceChange', handlePresenceChange);

    return () => {
      presenceSocket.off('userStatusUpdate', handleStatusUpdate);
      presenceSocket.off('usersStatus', handleUsersStatus);
      presenceSocket.off('presenceChange', handlePresenceChange);
    };
  }, [user, userIds.join(','), socketService]); // Use join for stable dependency

  return statuses;
}

export function useUserStatus(userId: string) {
  const statuses = usePresence([userId]);
  return statuses.get(userId)?.status || 'offline';
}

export function useCurrentUserStatus() {
  const { user } = useAuth();
  const { socketService } = useSocket();
  const [status, setStatus] = useState<'online' | 'away' | 'offline'>('online');

  const updateStatus = (newStatus: 'online' | 'away') => {
    if (socketService) {
      socketService.updateStatus(newStatus);
      setStatus(newStatus);
    }
  };

  return {
    status,
    setStatus: updateStatus,
    isOnline: status === 'online',
    isAway: status === 'away',
  };
}