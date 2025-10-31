// frontend/components/messages/direct-messages-client.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, MessageCircle, Send } from 'lucide-react';
import { useSocket } from '@/hooks/use-socket';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export function DirectMessagesClient() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { onMessage, offMessage, onTyping, offTyping, emit } = useSocket();

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Subscribe to WebSocket events
  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      if (message.conversationId === selectedConversation) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleTyping = (data: { conversationId: string; username: string }) => {
      console.log(`${data.username} is typing...`);
    };

    onMessage(handleNewMessage);
    onTyping(handleTyping);

    return () => {
      offMessage(handleNewMessage);
      offTyping(handleTyping);
    };
  }, [selectedConversation, onMessage, offMessage, onTyping, offTyping]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        if (data.length > 0) {
          setSelectedConversation(data[0].id);
          fetchMessages(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/messages/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      setSending(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: selectedConversation,
          content: messageInput.trim(),
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages((prev) => [...prev, newMessage]);
        setMessageInput('');
        emit('send_message', newMessage);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return <div className="p-4">Please log in to access messages</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-80px)] p-4">
      {/* Conversations List */}
      <Card className="md:col-span-1 flex flex-col">
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-2">
          {conversations.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No conversations yet</p>
          ) : (
            conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => {
                  setSelectedConversation(convo.id);
                  fetchMessages(convo.id);
                }}
                className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  selectedConversation === convo.id ? 'bg-muted' : 'hover:bg-muted'
                }`}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={convo.user.avatar} />
                  <AvatarFallback>
                    {convo.user.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium text-sm">{convo.user.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {convo.lastMessage || 'No messages yet'}
                  </p>
                </div>
                {convo.unreadCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 shrink-0">
                    {convo.unreadCount}
                  </span>
                )}
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {/* Messages View */}
      {selectedConversation ? (
        <Card className="md:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle>
              {conversations.find((c) => c.id === selectedConversation)?.user
                .displayName || 'Chat'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.senderId === user?.id ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.senderId === user?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <span className="text-xs opacity-70">
                    {formatDistanceToNow(new Date(msg.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="border-t p-4 flex gap-2">
            <Input
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              disabled={sending}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={sending || !messageInput.trim()}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </Card>
      ) : (
        <Card className="md:col-span-2 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Select a conversation to start</p>
          </div>
        </Card>
      )}
    </div>
  );
}
