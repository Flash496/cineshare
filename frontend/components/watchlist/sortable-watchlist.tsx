// frontend/components/watchlist/sortable-watchlist.tsx
'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableMovieCard } from './sortable-movie-card';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

interface Movie {
  id: string;
  movieId: number;
  order: number;
  watched: boolean;
  notes?: string;
  // Movie details from TMDB
  title: string;
  posterPath?: string;
  releaseDate?: string;
  rating?: number;
}

interface SortableWatchlistProps {
  watchlistId: string;
  initialMovies: Movie[];
  onUpdate?: () => void;
}

export function SortableWatchlist({
  watchlistId,
  initialMovies,
  onUpdate,
}: SortableWatchlistProps) {
  const { user } = useAuth();
  const [movies, setMovies] = useState(initialMovies);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = movies.findIndex((m) => m.id === active.id);
    const newIndex = movies.findIndex((m) => m.id === over.id);

    const newMovies = arrayMove(movies, oldIndex, newIndex);

    // Update order values
    const updatedMovies = newMovies.map((movie, index) => ({
      ...movie,
      order: index,
    }));

    // Optimistic update
    setMovies(updatedMovies);

    // Save to backend
    setIsSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const response = await fetch(
        `${API_URL}/watchlists/${watchlistId}/reorder`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            movies: updatedMovies.map((m) => ({
              movieId: m.movieId,
              order: m.order,
            })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reorder');
      }

      onUpdate?.();
    } catch (error) {
      // Revert on error
      setMovies(movies);
      toast.error('Error', {
        description: 'Failed to save order. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleWatched = async (movieId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const response = await fetch(
        `${API_URL}/watchlists/${watchlistId}/movies/${movieId}/toggle-watched`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const updated = await response.json();
        setMovies((prev) =>
          prev.map((m) =>
            m.movieId === movieId ? { ...m, watched: updated.watched } : m
          )
        );
        onUpdate?.();
      }
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to update status',
      });
    }
  };

  const handleRemove = async (movieId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const response = await fetch(
        `${API_URL}/watchlists/${watchlistId}/movies/${movieId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setMovies((prev) => prev.filter((m) => m.movieId !== movieId));
        toast.success('Removed', {
          description: 'Movie removed from watchlist',
        });
        onUpdate?.();
      }
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to remove movie',
      });
    }
  };

  if (movies.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No movies in this watchlist yet</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={movies} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {movies.map((movie) => (
            <SortableMovieCard
              key={movie.id}
              movie={movie}
              onToggleWatched={() => handleToggleWatched(movie.movieId)}
              onRemove={() => handleRemove(movie.movieId)}
            />
          ))}
        </div>
      </SortableContext>
      {isSaving && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Saving order...
        </div>
      )}
    </DndContext>
  );
}