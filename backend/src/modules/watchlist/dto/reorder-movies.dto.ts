// backend/src/modules/watchlist/dto/reorder-movies.dto.ts
import { IsArray, ValidateNested, IsInt } from 'class-validator'; // ✅ Added IsInt import
import { Type } from 'class-transformer';

class MovieOrder {
  @IsInt()
  movieId: number;

  @IsInt()
  order: number;
}

export class ReorderMoviesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MovieOrder)
  movies: MovieOrder[];
}