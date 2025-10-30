// backend/src/modules/messages/messages.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateConversation(userId1: string, userId2: string) {
    // Validate users are different
    if (userId1 === userId2) {
      throw new BadRequestException('Cannot create conversation with yourself');
    }

    // Sort IDs to ensure consistent lookup
    const participants = [userId1, userId2].sort();

    // Try to find existing conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { has: participants[0] } },
          { participants: { has: participants[1] } },
        ],
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Create if doesn't exist
    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          participants,
        },
        include: {
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });
    }

    return conversation;
  }

  async sendMessage(senderId: string, recipientId: string, content: string) {
    // Validate content
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Message content cannot be empty');
    }

    if (content.length > 5000) {
      throw new BadRequestException('Message content too long (max 5000 characters)');
    }

    const conversation = await this.getOrCreateConversation(senderId, recipientId);

    // Verify sender is participant
    if (!conversation.participants.includes(senderId)) {
      throw new ForbiddenException('Not a participant in this conversation');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    // Update conversation's last message
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessage: content.substring(0, 100),
        lastMessageAt: new Date(),
      },
    });

    return message;
  }

  async getConversations(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: {
          participants: { has: userId },
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.conversation.count({
        where: {
          participants: { has: userId },
        },
      }),
    ]);

    // Enrich with other participant info
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.participants.find((id) => id !== userId);
        
        if (!otherUserId) {
          return null; // Skip if no other user found
        }

        const otherUser = await this.prisma.user.findUnique({
          where: { id: otherUserId },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        });

        if (!otherUser) {
          return null; // Skip if user doesn't exist
        }

        // Count unread messages
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            read: false,
          },
        });

        return {
          ...conv,
          otherUser,
          unreadCount,
        };
      })
    );

    // Filter out null entries
    const validConversations = enriched.filter((conv) => conv !== null);

    return {
      conversations: validConversations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getMessages(
    conversationId: string,
    userId: string,
    page: number = 1,
    limit: number = 50,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!conversation.participants.includes(userId)) {
      throw new ForbiddenException('Not a participant in this conversation');
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.message.count({
        where: { conversationId },
      }),
    ]);

    return {
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!conversation.participants.includes(userId)) {
      throw new ForbiddenException('Not a participant in this conversation');
    }

    const result = await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        read: false,
      },
      data: {
        read: true,
      },
    });

    return {
      message: 'Messages marked as read',
      count: result.count,
    };
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.prisma.message.delete({
      where: { id: messageId },
    });

    return { message: 'Message deleted successfully' };
  }

  async getUnreadCount(userId: string): Promise<number> {
    // Get all conversations for user
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: { has: userId },
      },
      select: {
        id: true,
      },
    });

    const conversationIds = conversations.map((c) => c.id);

    // Count unread messages across all conversations
    const unreadCount = await this.prisma.message.count({
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: userId },
        read: false,
      },
    });

    return unreadCount;
  }

  async searchConversations(userId: string, query: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: { has: userId },
      },
    });

    // Get other participants
    const otherUserIds = conversations
      .map((conv) => conv.participants.find((id) => id !== userId))
      .filter((id): id is string => id !== undefined);

    // Search users by username or display name
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: otherUserIds },
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
      },
    });

    return users;
  }
}