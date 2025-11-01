// frontend/app/watchlists/[id]/edit/page.tsx
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { EditWatchlistForm } from '@/components/watchlist/edit-watchlist-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getWatchlist } from '@/lib/api/watchlists';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const watchlist = await getWatchlist(id);

  return {
    title: `Edit ${watchlist?.name || 'Watchlist'} | CineShare`,
    description: `Edit your watchlist on CineShare`,
  };
}

export default async function EditWatchlistPage({ params }: Props) {
  const { id } = await params;
  
  // Get the current authenticated user
  const currentUser = await getCurrentUser();
  
  // If not authenticated, redirect to login
  if (!currentUser) {
    redirect('/login');
  }
  
  // Fetch the watchlist
  const watchlist = await getWatchlist(id);
  
  // If watchlist doesn't exist, redirect to watchlists page
  if (!watchlist) {
    redirect('/watchlists');
  }
  
  // Check if current user is the owner
  if (currentUser.id !== watchlist.userId) {
    redirect(`/watchlists/${id}`);
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Back Button */}
        <Link href={`/watchlists/${id}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Watchlist
          </Button>
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Watchlist</h1>
          <p className="text-muted-foreground mt-1">
            Update your watchlist details
          </p>
        </div>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Watchlist Information</CardTitle>
            <CardDescription>
              Make changes to your watchlist. These changes will be visible to others if your watchlist is public.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditWatchlistForm watchlist={watchlist} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}