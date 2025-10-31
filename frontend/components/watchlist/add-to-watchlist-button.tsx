// frontend/components/watchlist/add-to-watchlist-button.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Check, Loader2, List } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { CreateWatchlistDialog } from './create-watchlist-dialog';

interface AddToWatchlistButtonProps {
  movieId: number;
  movieTitle: string;
  posterPath?: string;
}

interface Watchlist {
  id: string;
  name: string;
  hasMovie: boolean;
}

export function AddToWatchlistButton({
  movieId,
  movieTitle,
  posterPath,
}: AddToWatchlistButtonProps) {
  const { user } = useAuth();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchWatchlists();
    }
  }, [open, user]);

  const fetchWatchlists = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(
        `${API_URL}/watchlists/check-movie/${movieId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setWatchlists(data);
      }
    } catch (error) {
      console.error('Failed to fetch watchlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = async (watchlistId: string) => {
    if (!user) {
      toast.error('Authentication required', {
        description: 'Please log in to add movies to watchlists',
      });
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(
        `${API_URL}/watchlists/${watchlistId}/movies`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ movieId }),
        }
      );

      if (response.ok) {
        toast.success('Success!', {
          description: `Added "${movieTitle}" to watchlist`,
        });
        fetchWatchlists();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add movie');
      }
    } catch (error: any) {
      toast.error('Error', {
        description: error.message,
      });
    }
  };

  const handleRemoveFromWatchlist = async (watchlistId: string) => {
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
        toast.success('Removed', {
          description: `Removed "${movieTitle}" from watchlist`,
        });
        fetchWatchlists();
      }
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to remove movie',
      });
    }
  };

  if (!user) {
    return (
      <Button
        variant="outline"
        onClick={() => (window.location.href = '/auth/login')}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add to Watchlist
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add to Watchlist
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : watchlists.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No watchlists yet
            </div>
          ) : (
            watchlists.map((watchlist) => (
              <DropdownMenuItem
                key={watchlist.id}
                onClick={() =>
                  watchlist.hasMovie
                    ? handleRemoveFromWatchlist(watchlist.id)
                    : handleAddToWatchlist(watchlist.id)
                }
              >
                <span className="flex-1">{watchlist.name}</span>
                {watchlist.hasMovie && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
            <List className="mr-2 h-4 w-4" />
            Create New Watchlist
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWatchlistDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={fetchWatchlists}
        initialMovie={{
          id: movieId,
          title: movieTitle,
          posterPath,
        }}
      />
    </>
  );
}