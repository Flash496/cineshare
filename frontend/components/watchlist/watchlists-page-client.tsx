// frontend/components/watchlist/watchlists-page-client.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { WatchlistGrid } from './watchlist-grid';
import { CreateWatchlistDialog } from './create-watchlist-dialog';

export function WatchlistsPageClient() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleWatchlistCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Watchlists</h1>
          <p className="text-muted-foreground">
            Organize and track movies you want to watch
          </p>
        </div>

        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Watchlist
        </Button>
      </div>

      <WatchlistGrid key={refreshKey} />

      <CreateWatchlistDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={handleWatchlistCreated}
      />
    </div>
  );
}
