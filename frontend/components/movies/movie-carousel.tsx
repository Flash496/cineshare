// frontend/components/movies/movie-carousel.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
}

interface MovieCarouselProps {
  title: string;
  endpoint: string;
  className?: string;
}

export function MovieCarousel({ title, endpoint, className }: MovieCarouselProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    async function fetchMovies() {
      try {
        const response = await fetch(`/api/movies/${endpoint}`);
        const data = await response.json();
        setMovies(data.results || []);
      } catch (error) {
        console.error('Failed to fetch movies:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, [endpoint]);

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById(`carousel-${endpoint}`);
    if (!container) return;

    const scrollAmount = 300;
    const newPosition = direction === 'left'
      ? scrollPosition - scrollAmount
      : scrollPosition + scrollAmount;

    container.scrollTo({ left: newPosition, behavior: 'smooth' });
    setScrollPosition(newPosition);
  };

  const formatImageUrl = (path: string) => {
    return path ? `https://image.tmdb.org/t/p/w342${path}` : '/placeholder-movie.jpg';
  };

  const formatYear = (dateString: string) => {
    return dateString ? new Date(dateString).getFullYear() : 'TBA';
  };

  if (loading) {
    return (
      <div className={className}>
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex-shrink-0 w-48">
              <div className="aspect-[2/3] bg-muted animate-pulse rounded-lg mb-2" />
              <div className="h-4 bg-muted animate-pulse rounded mb-1" />
              <div className="h-3 bg-muted animate-pulse rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            disabled={scrollPosition <= 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        id={`carousel-${endpoint}`}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
        onScroll={(e) => setScrollPosition(e.currentTarget.scrollLeft)}
      >
        {movies.map((movie) => (
          <Link key={movie.id} href={`/movies/${movie.id}`}>
            <Card className="flex-shrink-0 w-48 hover:shadow-lg transition-shadow">
              <div className="relative aspect-[2/3] overflow-hidden rounded-t-lg">
                <Image
                  src={formatImageUrl(movie.poster_path)}
                  alt={movie.title}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
                {movie.vote_average > 0 && (
                  <Badge className="absolute top-2 right-2 gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    {movie.vote_average.toFixed(1)}
                  </Badge>
                )}
              </div>
              <CardContent className="p-3">
                <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                  {movie.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {formatYear(movie.release_date)}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}