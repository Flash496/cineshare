// frontend/components/navbar/global-search.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Film, Users, Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MovieResult {
  id: number;
  title: string;
  posterPath?: string;
  releaseDate?: string;
}

interface UserResult {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<MovieResult[]>([]);
  const [users, setUsers] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length < 2) {
      setMovies([]);
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const fetchOptions = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      const [moviesRes, usersRes] = await Promise.all([
        fetch(
          `/api/movies/search?q=${encodeURIComponent(searchQuery)}&limit=5`,
          fetchOptions
        ),
        fetch(
          `/api/users/search?q=${encodeURIComponent(searchQuery)}&limit=5`,
          fetchOptions
        ),
      ]);

      const moviesData = await moviesRes.json();
      const usersData = await usersRes.json();

      setMovies(moviesData.results || moviesData || []);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Search error:', error);
      setMovies([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMovie = (movieId: number) => {
    router.push(`/movies/${movieId}`);
    clearSearch();
  };

  const handleSelectUser = (username: string) => {
    router.push(`/profile/${username}`);
    clearSearch();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      clearSearch();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setOpen(false);
    setMovies([]);
    setUsers([]);
  };

  const hasResults = movies.length > 0 || users.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search movies, users..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim().length >= 2) {
                setOpen(true);
              }
            }}
            onFocus={() => {
              if (query.trim().length >= 2) {
                setOpen(true);
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                if (
                  document.activeElement !== inputRef.current &&
                  !document.activeElement?.closest('[role="dialog"]')
                ) {
                  setOpen(false);
                }
              }, 100);
            }}
            className="pl-10 pr-8 w-full"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-2.5"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </PopoverTrigger>

      {query.trim().length >= 2 && (
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
          }}
        >
          <Command>
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center p-4 gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Searching...</span>
                </div>
              ) : (
                <>
                  {/* Movies Section */}
                  {movies.length > 0 && (
                    <CommandGroup heading="Movies" className="overflow-hidden">
                      {movies.map((movie) => (
                        <CommandItem
                          key={`movie-${movie.id}`}
                          value={`movie-${movie.id}`}
                          onSelect={() => handleSelectMovie(movie.id)}
                          className="cursor-pointer flex items-center gap-3 px-2"
                        >
                          <Film className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 truncate">
                            <p className="font-medium text-sm">{movie.title}</p>
                          </div>
                          {movie.releaseDate && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {new Date(movie.releaseDate).getFullYear()}
                            </Badge>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {/* Users Section */}
                  {users.length > 0 && (
                    <CommandGroup heading="Users" className="overflow-hidden">
                      {users.map((user) => (
                        <CommandItem
                          key={`user-${user.id}`}
                          value={`user-${user.id}`}
                          onSelect={() => handleSelectUser(user.username)}
                          className="cursor-pointer flex items-center gap-3 px-2"
                        >
                          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 truncate">
                            <p className="font-medium text-sm">{user.displayName}</p>
                            <p className="text-xs text-muted-foreground">
                              @{user.username}
                            </p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {/* No Results */}
                  {!loading && movies.length === 0 && users.length === 0 && (
                    <CommandEmpty>No results found for "{query}"</CommandEmpty>
                  )}
                </>
              )}
            </CommandList>

            {/* Search All Results Button */}
            {hasResults && (
              <div className="border-t p-2">
                <Button
                  onClick={handleSearch}
                  variant="outline"
                  className="w-full text-xs"
                >
                  View all results for "{query}"
                </Button>
              </div>
            )}
          </Command>
        </PopoverContent>
      )}
    </Popover>
  );
}
