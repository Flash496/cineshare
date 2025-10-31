// frontend/components/movies/movie-card.tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Calendar } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { QuickAddButton } from '@/components/watchlist/quick-add-button';

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
  overview?: string;
}

interface MovieCardProps {
  movie: Movie;
  showQuickAdd?: boolean;
  variant?: 'default' | 'compact';
}

export function MovieCard({ 
  movie, 
  showQuickAdd = true,
  variant = 'default' 
}: MovieCardProps) {
  const getImageUrl = (path: string | null) => {
    return path 
      ? `https://image.tmdb.org/t/p/w342${path}` 
      : '/placeholder-movie.jpg';
  };

  const formatYear = (dateString: string) => {
    return dateString ? new Date(dateString).getFullYear() : 'TBA';
  };

  if (variant === 'compact') {
    return (
      <Link href={`/movies/${movie.id}`}>
        <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300">
          {/* Quick Add Button - Top Right Corner */}
          {showQuickAdd && (
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <QuickAddButton
                movieId={movie.id}
                movieTitle={movie.title}
                variant="default"
                size="icon"
              />
            </div>
          )}

          <CardContent className="p-0">
            <div className="flex gap-3">
              <div className="relative w-24 h-36 shrink-0">
                <Image
                  src={getImageUrl(movie.poster_path)}
                  alt={movie.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="96px"
                />
              </div>

              <div className="flex-1 py-3 pr-3 min-w-0">
                <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                  {movie.title}
                </h3>
                
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <Calendar className="h-3 w-3" />
                  <span>{formatYear(movie.release_date)}</span>
                </div>

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
    );
  }

  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300">
      <Link href={`/movies/${movie.id}`}>
        <div className="relative aspect-[2/3] overflow-hidden">
          <Image
            src={getImageUrl(movie.poster_path)}
            alt={movie.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Rating Badge */}
          {movie.vote_average > 0 && (
            <Badge className="absolute top-2 left-2 gap-1 bg-black/70 backdrop-blur-sm">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {movie.vote_average.toFixed(1)}
            </Badge>
          )}

          {/* Quick Add Button - Top Right Corner */}
          {showQuickAdd && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <QuickAddButton
                movieId={movie.id}
                movieTitle={movie.title}
                variant="default"
                size="icon"
              />
            </div>
          )}

          {/* Hover Info */}
          <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1 text-white text-xs">
              <Calendar className="h-3 w-3" />
              <span>{formatYear(movie.release_date)}</span>
            </div>
          </div>
        </div>

        <CardContent className="p-3">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {movie.title}
          </h3>
          {movie.overview && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {movie.overview}
            </p>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}