// frontend/components/messages/message-thread.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSocket } from '@/hooks/use-socket';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
}

interface MessageThreadProps {
  conversationId: string;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
}

export function MessageThread({
  conversationId,
  recipientId,
  recipientName,
  recipientAvatar,
}: MessageThreadProps) {
  const { user } = useAuth();
  const { socketService } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchMessages();

    if (!socketService) return;

    const messagesSocket = socketService.getNotificationSocket();
    if (!messagesSocket) return;

    // Join conversation room
    messagesSocket.emit('joinConversation', conversationId);

    // Listen for new messages
    const handleNewMessage = (message: Message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    };

    // Listen for typing
    const handleUserTyping = (data: { userId: string; isTyping: boolean }) => {
      if (data.userId === recipientId) {
        setIsTyping(data.isTyping);
      }
    };

    messagesSocket.on('newMessage', handleNewMessage);
    messagesSocket.on('userTyping', handleUserTyping);

    return () => {
      messagesSocket.emit('leaveConversation', conversationId);
      messagesSocket.off('newMessage', handleNewMessage);
      messagesSocket.off('userTyping', handleUserTyping);
    };
  }, [conversationId, socketService, recipientId]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const response = await fetch(`${API_URL}/messages/${conversationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || data);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !socketService) return;

    setSending(true);
    try {
      const messagesSocket = socketService.getNotificationSocket();
      messagesSocket?.emit('sendMessage', {
        recipientId,
        content: newMessage.trim(),
      });

      setNewMessage('');
      notifyTyping(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    notifyTyping(true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      notifyTyping(false);
    }, 1000);
  };

  const notifyTyping = (typing: boolean) => {
    if (!socketService) return;
    const messagesSocket = socketService.getNotificationSocket();
    messagesSocket?.emit('typing', {
      conversationId,
      isTyping: typing,
    });
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Avatar>
          <AvatarImage src={recipientAvatar} />
          <AvatarFallback>{recipientName[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold">{recipientName}</h3>
          {isTyping && (
            <p className="text-sm text-muted-foreground">typing...</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwnMessage = message.senderId === user?.id;
            return (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  isOwnMessage && 'flex-row-reverse'
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.sender.avatar} />
                  <AvatarFallback>
                    {message.sender.displayName[0]}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    'flex flex-col gap-1 max-w-[70%]',
                    isOwnMessage && 'items-end'
                  )}
                >
                  <div
                    className={cn(
                      'rounded-lg px-4 py-2',
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(message.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" disabled={!newMessage.trim() || sending}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}