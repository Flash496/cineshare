// frontend/app/watchlists/[id]/page.tsx
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { WatchlistPageClient } from '@/components/watchlist/watchlist-page-client';
import { getWatchlist, getWatchlistMovies } from '@/lib/api/watchlists';
import { getCurrentUser } from '@/lib/auth';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const watchlist = await getWatchlist(id);

  return {
    title: `${watchlist?.name || 'Watchlist'} | CineShare`,
    description: watchlist?.description || 'View this movie watchlist on CineShare',
  };
}

export default async function WatchlistPage({ params }: Props) {
  const { id } = await params;
  
  // Get current user (optional - user can view public watchlists without auth)
  const currentUser = await getCurrentUser();
  
  // Fetch watchlist data
  const watchlist = await getWatchlist(id);
  
  // If watchlist doesn't exist, redirect to 404
  if (!watchlist) {
    redirect('/watchlists');
  }
  
  // Check privacy - if private and not owner, redirect
  if (!watchlist.isPublic && currentUser?.id !== watchlist.userId) {
    redirect('/watchlists');
  }
  
  // Fetch movies in the watchlist
  const movies = await getWatchlistMovies(id);

  return (
    <WatchlistPageClient
      watchlist={watchlist}
      movies={movies}
      currentUserId={currentUser?.id || null}
    />
  );
}