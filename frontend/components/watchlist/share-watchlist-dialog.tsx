// frontend/components/watchlist/share-watchlist-dialog.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Share2, Copy, Check, Twitter, Facebook, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface ShareWatchlistDialogProps {
  watchlistId: string;
  watchlistName: string;
  isPublic: boolean;
}

export function ShareWatchlistDialog({
  watchlistId,
  watchlistName,
  isPublic,
}: ShareWatchlistDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/watchlists/${watchlistId}` 
    : '';
  const shareText = `Check out my "${watchlistName}" watchlist on CineShare!`;
  
  // Check if native share is available
  const canShare = typeof navigator !== 'undefined' && 
                   typeof navigator.share === 'function';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link. Please copy manually.');
    }
  };

  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank', 'width=550,height=420');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out my CineShare watchlist: ${watchlistName}`);
    const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareNative = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: watchlistName,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled');
      }
    }
  };

  if (!isPublic) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cannot Share Private Watchlist</DialogTitle>
            <DialogDescription>
              This watchlist is private. Make it public to share with others.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Watchlist</DialogTitle>
          <DialogDescription>
            Share "{watchlistName}" with others
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Copy Link */}
          <div className="space-y-2">
            <Label>Shareable Link</Label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                onClick={(e) => e.currentTarget.select()}
              />
              <Button onClick={copyToClipboard} size="icon" className="shrink-0">
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="space-y-2">
            <Label>Share on Social Media</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={shareOnTwitter} className="gap-2">
                <Twitter className="h-4 w-4" />
                Twitter
              </Button>
              <Button variant="outline" onClick={shareOnFacebook} className="gap-2">
                <Facebook className="h-4 w-4" />
                Facebook
              </Button>
              <Button variant="outline" onClick={shareViaEmail} className="gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Button>
              {canShare && (
                <Button variant="outline" onClick={shareNative} className="gap-2">
                  <Share2 className="h-4 w-4" />
                  More
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}