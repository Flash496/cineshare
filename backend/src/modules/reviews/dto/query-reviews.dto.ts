// src/modules/reviews/dto/query-reviews.dto.ts
import { IsOptional, IsEnum, IsInt, Min, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum ReviewSortBy {
  RECENT = 'recent',
  RATING_HIGH = 'rating_high',
  RATING_LOW = 'rating_low',
  MOST_LIKED = 'most_liked',
  MOST_DISCUSSED = 'most_discussed',
}

export class QueryReviewsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(ReviewSortBy)
  sortBy?: ReviewSortBy = ReviewSortBy.RECENT;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minRating?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxRating?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  spoilersOnly?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  noSpoilers?: boolean;
}