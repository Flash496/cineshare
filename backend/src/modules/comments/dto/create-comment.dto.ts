// backend/src/comments/dto/create-comment.dto.ts
import { IsString, IsNotEmpty, IsOptional, MaxLength, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Comment content is required' })
  @MaxLength(2000, { message: 'Comment must not exceed 2000 characters' })
  content: string;

  @IsOptional()
  @IsUUID('4', { message: 'Parent ID must be a valid UUID' })
  parentId?: string;
}