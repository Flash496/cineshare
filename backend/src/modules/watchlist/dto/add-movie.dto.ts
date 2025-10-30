// backend/src/modules/watchlist/dto/add-movie.dto.ts
import { IsInt, IsOptional, IsString, IsBoolean, MaxLength } from 'class-validator';

export class AddMovieToWatchlistDto {
  @IsInt()
  movieId: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  watched?: boolean = false;
}