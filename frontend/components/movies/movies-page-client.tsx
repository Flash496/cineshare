// frontend/components/movies/movies-page-client.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MovieCard } from './movie-card';
import { Loader2 } from 'lucide-react';

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
  overview?: string;
}

type SortBy = 'popular' | 'trending' | 'rated';

export function MoviesPageClient() {
  const [sortBy, setSortBy] = useState<SortBy>('popular');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch movies
  const fetchMovies = useCallback(
    async (pageNum: number, reset = false) => {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        
        const fetchOptions: RequestInit = {};
        if (token) {
          fetchOptions.headers = { Authorization: `Bearer ${token}` };
        }

        const response = await fetch(
          `/api/movies?sortBy=${sortBy}&page=${pageNum}&limit=20`,
          fetchOptions
        );

        if (!response.ok) throw new Error('Failed to fetch movies');

        const data = await response.json();

        if (reset) {
          setMovies(data.movies || []);
        } else {
          setMovies((prev) => [...prev, ...(data.movies || [])]);
        }

        setHasMore(data.hasMore !== false);
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setLoading(false);
      }
    },
    [sortBy]
  );

  // Reset and fetch when sort changes
  useEffect(() => {
    setPage(1);
    fetchMovies(1, true);
  }, [sortBy, fetchMovies]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
          fetchMovies(page + 1, false);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, page, fetchMovies]);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <section className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Discover Movies</h1>
        <p className="text-muted-foreground mb-6">
          Browse all movies sorted by your preference
        </p>

        {/* Sort Dropdown */}
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Popular</SelectItem>
            <SelectItem value="trending">Trending</SelectItem>
            <SelectItem value="rated">Highly Rated</SelectItem>
          </SelectContent>
        </Select>
      </section>

      {/* Movies Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>

      {/* Loading More Indicator */}
      <div
        ref={observerTarget}
        className="flex justify-center py-8 col-span-full"
      >
        {loading && <Loader2 className="h-6 w-6 animate-spin" />}
        {!hasMore && movies.length > 0 && (
          <p className="text-muted-foreground">No more movies to load</p>
        )}
      </div>

      {/* Empty State */}
      {!loading && movies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No movies found</p>
        </div>
      )}
    </div>
  );
}
