// frontend/types/comment.ts

export interface CommentUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  reviewId: string;
  parentId: string | null;
  user: CommentUser;
  replies?: Comment[];
}