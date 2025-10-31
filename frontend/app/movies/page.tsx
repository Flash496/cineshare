// frontend/app/movies/page.tsx
import { Metadata } from 'next';
import { MoviesPageClient } from '@/components/movies/movies-page-client';

export const metadata: Metadata = {
  title: 'Movies | CineShare',
  description: 'Discover and explore movies',
};

export default function MoviesPage() {
  return <MoviesPageClient />;
}
