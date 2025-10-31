// frontend/hooks/use-socket.ts
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './use-auth';
import { socketService } from '@/lib/socket';

interface SocketHook {
  socketService: typeof socketService;
  isConnected: boolean;
  onNotification: (callback: (notification: any) => void) => void;
  offNotification: (callback?: (notification: any) => void) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  updateStatus: (status: 'online' | 'away') => void;
  onPresenceChange: (callback: (data: { userId: string; status: string }) => void) => void;
  offPresenceChange: (callback?: (data: { userId: string; status: string }) => void) => void;
  subscribeFeed: (userId: string) => void;
  onNewActivity: (callback: (activity: any) => void) => void;
  offNewActivity: (callback?: (activity: any) => void) => void;
  onMessage: (callback: (message: any) => void) => void;
  offMessage: (callback?: (message: any) => void) => void;
  onTyping: (callback: (data: { conversationId: string; username: string }) => void) => void;
  offTyping: (callback?: (data: { conversationId: string; username: string }) => void) => void;
  emit: (event: string, data: any) => void;
}

export function useSocket(): SocketHook {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (user && token) {
      const sockets = socketService.connect(token);

      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);

      sockets.notifications?.on('connect', handleConnect);
      sockets.notifications?.on('disconnect', handleDisconnect);

      setIsConnected(socketService.isConnected());

      return () => {
        sockets.notifications?.off('connect', handleConnect);
        sockets.notifications?.off('disconnect', handleDisconnect);
        socketService.disconnect();
      };
    } else {
      setIsConnected(false);
      socketService.disconnect();
    }
  }, [user]);

  const onNotification = useCallback((callback: (notification: any) => void) => {
    socketService.onNotification(callback);
  }, []);

  const offNotification = useCallback((callback?: (notification: any) => void) => {
    socketService.offNotification(callback);
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    socketService.markAsRead(notificationId);
  }, []);

  const markAllAsRead = useCallback(() => {
    socketService.markAllAsRead();
  }, []);

  const updateStatus = useCallback((status: 'online' | 'away') => {
    socketService.updateStatus(status);
  }, []);

  const onPresenceChange = useCallback((callback: (data: { userId: string; status: string }) => void) => {
    socketService.onPresenceChange(callback);
  }, []);

  const offPresenceChange = useCallback((callback?: (data: { userId: string; status: string }) => void) => {
    socketService.offPresenceChange(callback);
  }, []);

  const subscribeFeed = useCallback((userId: string) => {
    socketService.subscribeFeed(userId);
  }, []);

  const onNewActivity = useCallback((callback: (activity: any) => void) => {
    socketService.onNewActivity(callback);
  }, []);

  const offNewActivity = useCallback((callback?: (activity: any) => void) => {
    socketService.offNewActivity(callback);
  }, []);

  const onMessage = useCallback((callback: (message: any) => void) => {
    const notificationSocket = socketService.getNotificationSocket();
    notificationSocket?.on('new_message', callback);
  }, []);

  const offMessage = useCallback((callback?: (message: any) => void) => {
    const notificationSocket = socketService.getNotificationSocket();
    notificationSocket?.off('new_message', callback);
  }, []);

  const onTyping = useCallback((callback: (data: { conversationId: string; username: string }) => void) => {
    const notificationSocket = socketService.getNotificationSocket();
    notificationSocket?.on('typing', callback);
  }, []);

  const offTyping = useCallback((callback?: (data: { conversationId: string; username: string }) => void) => {
    const notificationSocket = socketService.getNotificationSocket();
    notificationSocket?.off('typing', callback);
  }, []);

  const emit = useCallback((event: string, data: any) => {
    const notificationSocket = socketService.getNotificationSocket();
    notificationSocket?.emit(event, data);
  }, []);

  return {
    socketService,
    isConnected,
    onNotification,
    offNotification,
    markAsRead,
    markAllAsRead,
    updateStatus,
    onPresenceChange,
    offPresenceChange,
    subscribeFeed,
    onNewActivity,
    offNewActivity,
    onMessage,
    offMessage,
    onTyping,
    offTyping,
    emit,
  };
}
