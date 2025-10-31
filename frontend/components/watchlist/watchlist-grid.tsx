// frontend/components/watchlist/watchlist-grid.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Globe, MoreHorizontal, Trash2, Edit, Share } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Watchlist {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  _count: {
    movies: number;
  };
  movies: Array<{
    movieId: number;
    posterPath?: string;
    title?: string;
  }>;
}

export function WatchlistGrid() {
  const { user } = useAuth();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWatchlists();
    }
  }, [user]);

  const fetchWatchlists = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const response = await fetch(`${API_URL}/watchlists`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWatchlists(data);
      }
    } catch (error) {
      console.error('Failed to fetch watchlists:', error);
      toast.error('Failed to load watchlists');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this watchlist?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const response = await fetch(`${API_URL}/watchlists/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setWatchlists((prev) => prev.filter((w) => w.id !== id));
        toast.success('Watchlist deleted');
      }
    } catch (error) {
      console.error('Failed to delete watchlist:', error);
      toast.error('Failed to delete watchlist');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (watchlists.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground mb-4">
            You haven't created any watchlists yet
          </p>
          <Button>Create Your First Watchlist</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {watchlists.map((watchlist) => (
        <Card key={watchlist.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="line-clamp-1">{watchlist.name}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  {watchlist.isPublic ? (
                    <Badge variant="outline" className="gap-1">
                      <Globe className="h-3 w-3" />
                      Public
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Private
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    {watchlist._count.movies} movies
                  </Badge>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/watchlists/${watchlist.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(watchlist.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent>
            {watchlist.description && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {watchlist.description}
              </p>
            )}

            {/* Movie Poster Grid Preview */}
            {watchlist.movies.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {watchlist.movies.slice(0, 4).map((movie, idx) => (
                  <div
                    key={idx}
                    className="aspect-[2/3] bg-muted rounded overflow-hidden"
                  >
                    {movie.posterPath ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w185${movie.posterPath}`}
                        alt={movie.title || 'Movie'}
                        width={92}
                        height={138}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        ?
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/watchlists/${watchlist.id}`}>
                View Watchlist
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}