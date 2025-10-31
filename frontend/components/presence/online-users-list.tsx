// frontend/components/presence/online-users-list.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface OnlineUser {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
}

export function OnlineUsersList() {
  const { socketService } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    if (!socketService) return;

    const presenceSocket = socketService.getPresenceSocket();
    if (!presenceSocket) return;

    // Request online users list
    presenceSocket.emit('getOnlineUsers');

    const handleOnlineUsersList = (userIds: string[]) => {
      setOnlineUsers(userIds);
      // Fetch user details
      fetchUserDetails(userIds);
    };

    const handlePresenceChange = (data: { userId: string; status: string }) => {
      if (data.status === 'online') {
        setOnlineUsers((prev) => {
          if (!prev.includes(data.userId)) {
            const updated = [...prev, data.userId];
            fetchUserDetails(updated);
            return updated;
          }
          return prev;
        });
      } else {
        setOnlineUsers((prev) => {
          const updated = prev.filter((id) => id !== data.userId);
          fetchUserDetails(updated);
          return updated;
        });
      }
    };

    presenceSocket.on('onlineUsersList', handleOnlineUsersList);
    presenceSocket.on('presenceChange', handlePresenceChange);

    return () => {
      presenceSocket.off('onlineUsersList', handleOnlineUsersList);
      presenceSocket.off('presenceChange', handlePresenceChange);
    };
  }, [socketService]);

  const fetchUserDetails = async (userIds: string[]) => {
    if (userIds.length === 0) {
      setUsers([]);
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      // This assumes you have a bulk user fetch endpoint
      // You'll need to create this endpoint in your backend
      const response = await fetch(`${API_URL}/users/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIds }),
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Online Now
          </CardTitle>
          <Badge variant="secondary">{onlineUsers.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No users online
            </p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        {(user.displayName || user.username)[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.displayName || user.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{user.username}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
