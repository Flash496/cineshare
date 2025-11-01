// frontend/components/watchlist/watchlist-page-client.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, Loader2 } from 'lucide-react';
import { SortableWatchlist } from '@/components/watchlist/sortable-watchlist';
import { PrivacyToggle } from '@/components/watchlist/privacy-toggle';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Movie {
  id: string;
  movieId: number;
  order: number;
  watched: boolean;
  notes?: string;
  title: string;
  posterPath?: string;
  releaseDate?: string;
  rating?: number;
}

interface Watchlist {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  _count: {
    movies: number;
  };
}

interface WatchlistPageClientProps {
  watchlist: Watchlist;
  movies: Movie[];
  currentUserId: string | null;
}

export function WatchlistPageClient({
  watchlist: initialWatchlist,
  movies: initialMovies,
  currentUserId,
}: WatchlistPageClientProps) {
  const router = useRouter();
  const [watchlist, setWatchlist] = useState(initialWatchlist);
  const [movies, setMovies] = useState(initialMovies);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = currentUserId === watchlist.userId;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`/api/watchlists/${watchlist.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Watchlist deleted successfully');
        router.push('/watchlists');
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast.error('Failed to delete watchlist');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => router.push('/watchlists')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Watchlists
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{watchlist.name}</h1>
            {watchlist.description && (
              <p className="text-muted-foreground mb-4">{watchlist.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>by {watchlist.user.displayName || watchlist.user.username}</span>
              <span>•</span>
              <span>{watchlist._count.movies} movies</span>
            </div>
          </div>

          {isOwner && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push(`/watchlists/${watchlist.id}/edit`)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Privacy Toggle - Only for owner */}
      {isOwner && (
        <div className="mb-6">
          <PrivacyToggle
            watchlistId={watchlist.id}
            initialIsPublic={watchlist.isPublic}
            onUpdate={(isPublic) => {
              setWatchlist((prev) => ({ ...prev, isPublic }));
            }}
          />
        </div>
      )}

      {/* Movies List */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Movies</h2>
        <SortableWatchlist
          watchlistId={watchlist.id}
          initialMovies={movies}
          onUpdate={handleRefresh}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Watchlist?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{watchlist.name}"? This action cannot
              be undone and will remove all movies from this watchlist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}