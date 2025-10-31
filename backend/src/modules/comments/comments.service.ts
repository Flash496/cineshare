// backend/src/modules/comments/comments.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, reviewId: string, content: string, parentId?: string) {
    // Validate content
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Comment content cannot be empty');
    }

    if (content.length > 2000) {
      throw new BadRequestException('Comment is too long (max 2000 characters)');
    }

    // Check if review exists
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        userId: true,
        title: true,
        movieId: true,
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // If it's a reply, check if parent comment exists
    if (parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      if (parentComment.reviewId !== reviewId) {
        throw new BadRequestException('Parent comment does not belong to this review');
      }
    }

    // Extract mentions
    const mentions = this.extractMentions(content);

    // Create comment
    const comment = await this.prisma.comment.create({
      data: {
        userId,
        reviewId,
        content: content.trim(),
        parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        review: {
          select: {
            userId: true,
            title: true,
            movieId: true,
          },
        },
      },
    });

    // Send notifications
    try {
      // Notify review author (if not commenting on own review)
      if (comment.review.userId !== userId) {
        await this.notificationsService.createNotification({
          userId: comment.review.userId,
          type: 'comment',
          actorId: userId,
          referenceId: comment.id,
          message: `commented on your review`,
          link: `/reviews/${reviewId}#comment-${comment.id}`,
        });
      }

      // If it's a reply, notify the parent comment author
      if (parentId) {
        const parentComment = await this.prisma.comment.findUnique({
          where: { id: parentId },
          select: { userId: true },
        });

        if (parentComment && parentComment.userId !== userId && parentComment.userId !== comment.review.userId) {
          await this.notificationsService.createNotification({
            userId: parentComment.userId,
            type: 'comment',
            actorId: userId,
            referenceId: comment.id,
            message: `replied to your comment`,
            link: `/reviews/${reviewId}#comment-${comment.id}`,
          });
        }
      }

      // Notify mentioned users
      for (const username of mentions) {
        const mentionedUser = await this.prisma.user.findUnique({
          where: { username },
          select: { id: true },
        });

        if (mentionedUser && mentionedUser.id !== userId) {
          await this.notificationsService.createNotification({
            userId: mentionedUser.id,
            type: 'mention',
            actorId: userId,
            referenceId: comment.id,
            message: `mentioned you in a comment`,
            link: `/reviews/${reviewId}#comment-${comment.id}`,
          });
        }
      }
    } catch (error) {
      console.error('Failed to send comment notifications:', error);
      // Don't fail comment creation if notifications fail
    }

    return comment;
  }

  async findByReview(reviewId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // Get top-level comments (no parent)
    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          reviewId,
          parentId: null,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          replies: {
            take: 5, // Show first 5 replies
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.comment.count({
        where: {
          reviewId,
          parentId: null,
        },
      }),
    ]);

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getReplies(parentId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [replies, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { parentId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        skip,
        take: limit,
      }),
      this.prisma.comment.count({
        where: { parentId },
      }),
    ]);

    return {
      replies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  async update(id: string, userId: string, content: string) {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Comment content cannot be empty');
    }

    if (content.length > 2000) {
      throw new BadRequestException('Comment is too long (max 2000 characters)');
    }

    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    return this.prisma.comment.update({
      where: { id },
      data: {
        content: content.trim(),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Delete comment (cascade will delete replies)
    await this.prisma.comment.delete({
      where: { id },
    });

    return { 
      message: 'Comment deleted successfully',
      deletedReplies: comment._count.replies,
    };
  }

  async findByUser(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          review: {
            select: {
              id: true,
              title: true,
              movieId: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                },
              },
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.comment.count({
        where: { userId },
      }),
    ]);

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getCommentCount(reviewId: string): Promise<number> {
    return this.prisma.comment.count({
      where: { reviewId },
    });
  }

  /**
   * Extract @mentions from comment content
   */
  private extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    // Remove duplicates
    return [...new Set(mentions)];
  }
}