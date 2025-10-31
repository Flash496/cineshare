// frontend/app/watchlists/page.tsx
import { Metadata } from 'next';
import { WatchlistsPageClient } from '@/components/watchlist/watchlists-page-client';

export const metadata: Metadata = {
  title: 'My Watchlists | CineShare',
  description: 'Organize movies you want to watch',
};

export default function WatchlistsPage() {
  return <WatchlistsPageClient />;
}