// src/modules/tmdb/dto/movie-details.dto.ts

export interface MovieDetailsDto {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  runtime: number;
  vote_average: number;
  vote_count: number;
  poster_path: string | null;  // ✅ Fixed: can be null
  backdrop_path: string | null; // ✅ Fixed: can be null
  genres: Genre[];
  credits: {
    cast: Actor[];
    crew: CrewMember[];
  };
  videos: {
    results: Video[];
  };
  similar: {
    results: Movie[];
  };
}

export interface Genre {  // ✅ Fixed: exported
  id: number;
  name: string;
}

export interface Actor {  // ✅ Fixed: exported
  id: number;
  name: string;
  character: string;
  profile_path: string | null;  // ✅ Fixed: can be null
}

export interface CrewMember {  // ✅ Fixed: exported
  id: number;
  name: string;
  job: string;
  department: string;
}

export interface Video {  // ✅ Fixed: exported
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface Movie {  // ✅ Added: was missing
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
}