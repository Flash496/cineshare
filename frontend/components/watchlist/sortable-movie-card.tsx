// frontend/components/watchlist/sortable-movie-card.tsx
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Trash2, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Movie {
  id: string;
  movieId: number;
  watched: boolean;
  notes?: string;
  title: string;
  posterPath?: string;
  releaseDate?: string;
  rating?: number;
}

interface SortableMovieCardProps {
  movie: Movie;
  onToggleWatched: () => void;
  onRemove: () => void;
}

export function SortableMovieCard({
  movie,
  onToggleWatched,
  onRemove,
}: SortableMovieCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: movie.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="hover:shadow-md transition-shadow"
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Watched Checkbox */}
          <Checkbox
            checked={movie.watched}
            onCheckedChange={onToggleWatched}
            className="shrink-0"
          />

          {/* Movie Poster */}
          <Link href={`/movies/${movie.movieId}`} className="shrink-0">
            <Image
              src={
                movie.posterPath
                  ? `https://image.tmdb.org/t/p/w92${movie.posterPath}`
                  : '/placeholder-movie.png'
              }
              alt={movie.title}
              width={46}
              height={69}
              className="rounded object-cover"
            />
          </Link>

          {/* Movie Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/movies/${movie.movieId}`}
                className="font-semibold hover:underline line-clamp-1"
              >
                {movie.title}
              </Link>
              {movie.releaseDate && (
                <span className="text-sm text-muted-foreground shrink-0">
                  ({movie.releaseDate.split('-')[0]})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1">
              {movie.watched && <Badge variant="secondary">Watched</Badge>}
              {movie.rating && (
                <span className="text-sm text-muted-foreground">
                  ⭐ {movie.rating.toFixed(1)}
                </span>
              )}
            </div>

            {movie.notes && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {movie.notes}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/movies/${movie.movieId}`}>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
