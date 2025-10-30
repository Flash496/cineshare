// backend/src/modules/users/dto/update-profile.dto.ts
import { 
  IsString, 
  IsOptional, 
  MaxLength, 
  MinLength,
  IsUrl,
  Matches 
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Display name must be at least 2 characters' })
  @MaxLength(50, { message: 'Display name must be at most 50 characters' })
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Bio must be at most 500 characters' })
  bio?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Avatar must be a valid URL' })
  @MaxLength(500, { message: 'Avatar URL must be at most 500 characters' })
  avatar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Location must be at most 100 characters' })
  location?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Website must be a valid URL' })
  @MaxLength(200, { message: 'Website URL must be at most 200 characters' })
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Favorite genre must be at most 50 characters' })
  favoriteGenre?: string;
}

export class ProfileStatsDto {
  moviesWatched: number;
  reviewsWritten: number;
  followers: number;
  following: number;
  averageRating: number;
  totalLikes: number;
  memberSince: Date;
}