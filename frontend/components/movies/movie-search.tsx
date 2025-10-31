// frontend/components/movies/movie-search.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Movie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string;
  vote_average: number;
  genre_ids: number[];
}

interface SearchResult {
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export function MovieSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const debouncedQuery = useDebounce(query, 300);

  const searchMovies = useCallback(async (searchQuery: string, searchPage: number = 1) => {
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/movies/search?q=${encodeURIComponent(searchQuery)}&page=${searchPage}`
      );
      const data = await response.json();

      if (searchPage === 1) {
        setResults(data);
      } else {
        setResults(prev => ({
          ...data,
          results: [...(prev?.results || []), ...data.results]
        }));
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    searchMovies(debouncedQuery, 1);
  }, [debouncedQuery, searchMovies]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    searchMovies(debouncedQuery, nextPage);
  };

  const formatImageUrl = (path: string) => {
    return path ? `https://image.tmdb.org/t/p/w500${path}` : '/placeholder-movie.jpg';
  };

  const formatYear = (dateString: string) => {
    return dateString ? new Date(dateString).getFullYear() : 'TBA';
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for movies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-12 text-lg"
        />
      </div>

      {loading && page === 1 && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Searching movies...</p>
        </div>
      )}

      {results && results.results.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Found {results.total_results.toLocaleString()} results
          </p>

          <div className="space-y-4">
            {results.results.map((movie) => (
              <Card key={movie.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <Link href={`/movies/${movie.id}`}>
                    <div className="flex gap-4 p-4">
                      <div className="shrink-0">
                        <Image
                          src={formatImageUrl(movie.poster_path)}
                          alt={movie.title}
                          width={80}
                          height={120}
                          className="rounded-md object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="font-semibold text-lg line-clamp-1">
                              {movie.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {formatYear(movie.release_date)}
                            </p>
                          </div>

                          {movie.vote_average > 0 && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">
                                {movie.vote_average.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>

                        {movie.overview && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {movie.overview}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {results.total_pages > page && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={loadMore}
                disabled={loading}
                variant="outline"
                size="lg"
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      )}

      {results && results.results.length === 0 && !loading && (
        <div className="text-center py-12 space-y-2">
          <p className="text-lg font-medium">No movies found for "{query}"</p>
          <p className="text-sm text-muted-foreground">
            Try different keywords or check your spelling
          </p>
        </div>
      )}
    </div>
  );
}