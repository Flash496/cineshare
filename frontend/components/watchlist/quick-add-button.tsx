// frontend/components/watchlist/quick-add-button.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface QuickAddButtonProps {
  movieId: number;
  movieTitle: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function QuickAddButton({
  movieId,
  movieTitle,
  variant = 'ghost',
  size = 'icon',
  showLabel = false,
}: QuickAddButtonProps) {
  const { user } = useAuth();
  const [isAdded, setIsAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [defaultWatchlistId, setDefaultWatchlistId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      checkIfAdded();
      getDefaultWatchlist();
    }
  }, [user, movieId]);

  const checkIfAdded = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const response = await fetch(`${API_URL}/watchlists/check-movie/${movieId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const watchlists = await response.json();
        setIsAdded(watchlists.some((w: any) => w.hasMovie));
      }
    } catch (error) {
      // Silently fail
    }
  };

  const getDefaultWatchlist = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const response = await fetch(`${API_URL}/watchlists`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const watchlists = await response.json();
        // Find "Want to Watch" or use first watchlist
        const defaultList =
          watchlists.find((w: any) => w.name.toLowerCase() === 'want to watch') ||
          watchlists[0];

        if (defaultList) {
          setDefaultWatchlistId(defaultList.id);
        }
      }
    } catch (error) {
      // Silently fail
    }
  };

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please log in to add movies to your watchlist');
      return;
    }

    if (!defaultWatchlistId) {
      toast.error('Please create a watchlist first');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const response = await fetch(
        `${API_URL}/watchlists/${defaultWatchlistId}/movies`,
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
        setIsAdded(true);
        toast.success(`Added "${movieTitle}" to your watchlist`);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add movie');
      }
    } catch (error: any) {
      if (error.message?.includes('already in')) {
        setIsAdded(true);
      }
      toast.error(error.message || 'Failed to add movie');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleQuickAdd}
      disabled={loading || isAdded}
      className={cn(isAdded && 'text-green-500')}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {showLabel && <span className="ml-2">Adding...</span>}
        </>
      ) : isAdded ? (
        <>
          <Check className="h-4 w-4" />
          {showLabel && <span className="ml-2">Added</span>}
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" />
          {showLabel && <span className="ml-2">Add</span>}
        </>
      )}
    </Button>
  );
}