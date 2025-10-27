// backend/src/modules/users/dto/update-profile.dto.ts
import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

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
  @IsString()
  @MaxLength(500, { message: 'Avatar URL must be at most 500 characters' })
  avatar?: string;
}