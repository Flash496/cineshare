// frontend/components/watchlist/privacy-toggle.tsx
'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Globe, Lock, Loader2 } from 'lucide-react';
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
import { toast } from 'sonner';

interface PrivacyToggleProps {
  watchlistId: string;
  initialIsPublic: boolean;
  onUpdate?: (isPublic: boolean) => void;
}

export function PrivacyToggle({
  watchlistId,
  initialIsPublic,
  onUpdate,
}: PrivacyToggleProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingValue, setPendingValue] = useState(false);

  const handleToggle = (checked: boolean) => {
    // If making public, confirm first
    if (checked) {
      setPendingValue(true);
      setShowConfirm(true);
    } else {
      // Making private, no confirmation needed
      updateVisibility(false);
    }
  };

  const confirmMakePublic = () => {
    setShowConfirm(false);
    updateVisibility(true);
  };

  const updateVisibility = async (newValue: boolean) => {
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `/api/watchlists/${watchlistId}/toggle-visibility`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update privacy setting');
      }

      const data = await response.json();
      setIsPublic(data.isPublic);
      onUpdate?.(data.isPublic);

      toast.success(
        data.isPublic
          ? 'Your watchlist is now public'
          : 'Your watchlist is now private'
      );
    } catch (error) {
      toast.error('Failed to update privacy setting');
      // Revert the state on error
      setIsPublic(initialIsPublic);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-start gap-3">
          {isPublic ? (
            <Globe className="h-5 w-5 text-green-500 mt-0.5" />
          ) : (
            <Lock className="h-5 w-5 text-gray-500 mt-0.5" />
          )}
          <div className="space-y-1">
            <Label htmlFor="privacy-toggle" className="font-medium">
              {isPublic ? 'Public Watchlist' : 'Private Watchlist'}
            </Label>
            <p className="text-sm text-muted-foreground">
              {isPublic
                ? 'Anyone can view this watchlist'
                : 'Only you can view this watchlist'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          <Switch
            id="privacy-toggle"
            checked={isPublic}
            onCheckedChange={handleToggle}
            disabled={loading}
          />
        </div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Make watchlist public?</AlertDialogTitle>
            <AlertDialogDescription>
              This watchlist will be visible to everyone on CineShare. Anyone
              will be able to view the movies you've added and your notes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMakePublic}>
              Make Public
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}