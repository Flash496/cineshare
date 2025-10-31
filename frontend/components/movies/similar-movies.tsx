// frontend/components/movies/similar-movies.tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
}

interface SimilarMoviesProps {
  movies: Movie[];
}

export function SimilarMovies({ movies }: SimilarMoviesProps) {
  const getImageUrl = (path: string | null) => {
    return path ? `https://image.tmdb.org/t/p/w342${path}` : '/placeholder-movie.jpg';
  };

  const formatYear = (dateString: string) => {
    return dateString ? new Date(dateString).getFullYear() : 'TBA';
  };

  if (movies.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Similar Movies</h2>
        <Card>
          <CardContent className="py-8">
            <p className="text-muted-foreground text-center text-sm">
              No similar movies found
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Similar Movies</h2>
      <div className="space-y-4">
        {movies.slice(0, 6).map((movie) => (
          <Link key={movie.id} href={`/movies/${movie.id}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-0">
                <div className="flex gap-3">
                  <div className="relative w-24 h-36 shrink-0">
                    <Image
                      src={getImageUrl(movie.poster_path)}
                      alt={movie.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>

                  <div className="flex-1 py-3 pr-3 min-w-0">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                      {movie.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      {formatYear(movie.release_date)}
                    </p>

                    {movie.vote_average > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium">
                          {movie.vote_average.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {movies.length > 6 && (
        <p className="text-xs text-muted-foreground text-center">
          Showing 6 of {movies.length} similar movies
        </p>
      )}
    </div>
  );
}