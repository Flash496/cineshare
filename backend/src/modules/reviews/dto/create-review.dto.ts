// backend/src/modules/reviews/dto/create-review.dto.ts
import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsBoolean, 
  IsInt,
  Min, 
  Max, 
  MaxLength,
  MinLength 
} from 'class-validator';
import { Transform } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  movieId: number;

  @IsNumber()
  @Min(0, { message: 'Rating must be at least 0' })
  @Max(10, { message: 'Rating must be at most 10' })
  @Transform(({ value }) => Math.round(value * 10) / 10)
  rating: number;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  @MaxLength(200, { message: 'Title must be at most 200 characters' })
  @Transform(({ value }) => 
    value ? sanitizeHtml(value, { 
      allowedTags: [], 
      allowedAttributes: {} 
    }).trim() : value
  )
  title?: string;

  @IsString()
  @MinLength(10, { message: 'Content must be at least 10 characters' })
  @MaxLength(5000, { message: 'Content must be at most 5000 characters' })
  @Transform(({ value }) => 
    sanitizeHtml(value, { 
      allowedTags: [], 
      allowedAttributes: {} 
    }).trim()
  )
  content: string;

  @IsOptional()
  @IsBoolean()
  hasSpoilers?: boolean;
}

export class UpdateReviewDto {
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Rating must be at least 0' })
  @Max(10, { message: 'Rating must be at most 10' })
  @Transform(({ value }) => value ? Math.round(value * 10) / 10 : value)
  rating?: number;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  @MaxLength(200, { message: 'Title must be at most 200 characters' })
  @Transform(({ value }) => 
    value ? sanitizeHtml(value, { 
      allowedTags: [], 
      allowedAttributes: {} 
    }).trim() : value
  )
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Content must be at least 10 characters' })
  @MaxLength(5000, { message: 'Content must be at most 5000 characters' })
  @Transform(({ value }) => 
    value ? sanitizeHtml(value, { 
      allowedTags: [], 
      allowedAttributes: {} 
    }).trim() : value
  )
  content?: string;

  @IsOptional()
  @IsBoolean()
  hasSpoilers?: boolean;
}