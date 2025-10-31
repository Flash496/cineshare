// frontend/components/watchlist/compact-privacy-toggle.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Globe, Lock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface CompactPrivacyToggleProps {
  watchlistId: string;
  initialIsPublic: boolean;
  onUpdate?: (isPublic: boolean) => void;
}

export function CompactPrivacyToggle({
  watchlistId,
  initialIsPublic,
  onUpdate,
}: CompactPrivacyToggleProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const response = await fetch(
        `${API_URL}/watchlists/${watchlistId}/toggle-visibility`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to toggle privacy');
      }

      const data = await response.json();
      setIsPublic(data.isPublic);
      onUpdate?.(data.isPublic);

      toast.success(
        data.isPublic ? 'Watchlist is now public' : 'Watchlist is now private'
      );
    } catch (error) {
      toast.error('Failed to update privacy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            disabled={loading}
          >
            {isPublic ? (
              <Globe className="h-4 w-4 text-green-500" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isPublic ? 'Public - Click to make private' : 'Private - Click to make public'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}