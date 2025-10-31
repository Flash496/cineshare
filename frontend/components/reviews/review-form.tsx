// frontend/components/reviews/review-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Star, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

interface ReviewFormProps {
  movieId: number;
  movieTitle: string;
  existingReview?: {
    id: string;
    rating: number;
    title?: string;
    content: string;
    hasSpoilers: boolean;
  };
  onSuccess?: () => void;
}

export function ReviewForm({ 
  movieId, 
  movieTitle, 
  existingReview, 
  onSuccess 
}: ReviewFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    rating: existingReview?.rating || 0,
    title: existingReview?.title || '',
    content: existingReview?.content || '',
    hasSpoilers: existingReview?.hasSpoilers || false,
  });

  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Authentication required', {
        description: 'Please log in to write a review',
      });
      router.push('/auth/login');
      return;
    }

    if (formData.rating === 0) {
      toast.error('Rating required', {
        description: 'Please select a rating for this movie',
      });
      return;
    }

    if (formData.content.trim().length < 10) {
      toast.error('Review too short', {
        description: 'Please write at least 10 characters',
      });
      return;
    }

    setLoading(true);

    try {
      // Get token from localStorage
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = existingReview
        ? `/api/reviews/${existingReview.id}`
        : '/api/reviews';
      const method = existingReview ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          movieId,
          ...formData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save review');
      }

      toast.success('Success!', {
        description: existingReview
          ? 'Your review has been updated'
          : 'Your review has been published',
      });

      onSuccess?.();

      if (!existingReview) {
        // Reset form for new reviews
        setFormData({
          rating: 0,
          title: '',
          content: '',
          hasSpoilers: false,
        });
      }
    } catch (error: any) {
      toast.error('Error', {
        description: error.message || 'Failed to save review',
      });
    } finally {
      setLoading(false);
    }
  };

  const setRating = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

  const getRatingText = (rating: number) => {
    if (rating === 0) return 'No rating';
    if (rating <= 2) return 'Terrible';
    if (rating <= 4) return 'Poor';
    if (rating <= 6) return 'Average';
    if (rating <= 8) return 'Good';
    return 'Excellent';
  };

  const getRatingColor = (rating: number) => {
    if (rating <= 2) return 'text-red-500';
    if (rating <= 4) return 'text-orange-500';
    if (rating <= 6) return 'text-yellow-500';
    if (rating <= 8) return 'text-blue-500';
    return 'text-green-500';
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {existingReview ? 'Edit Review' : 'Write a Review'} for {movieTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <Label className="text-base font-medium">Rating *</Label>
            <div className="mt-2 space-y-2">
              <div className="flex gap-1">
                {Array.from({ length: 10 }, (_, i) => {
                  const ratingValue = i + 1;
                  const isHalf =
                    (hoverRating || formData.rating) >= ratingValue - 0.5 &&
                    (hoverRating || formData.rating) < ratingValue;
                  const isFull = (hoverRating || formData.rating) >= ratingValue;

                  return (
                    <button
                      key={i}
                      type="button"
                      className="p-1 hover:scale-110 transition-transform"
                      onMouseEnter={() => setHoverRating(ratingValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(ratingValue)}
                    >
                      <Star
                        className={cn(
                          'h-6 w-6 transition-colors',
                          isFull
                            ? 'fill-yellow-400 text-yellow-400'
                            : isHalf
                            ? 'fill-yellow-200 text-yellow-400'
                            : 'text-gray-300'
                        )}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getRatingColor(formData.rating)}>
                  {formData.rating}/10
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {getRatingText(formData.rating)}
                </span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Review Title (Optional)</Label>
            <Input
              id="title"
              placeholder="Give your review a catchy title..."
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.title.length}/200 characters
            </p>
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content">Your Review *</Label>
            <Textarea
              id="content"
              placeholder="Share your thoughts about this movie..."
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              className="min-h-[150px] resize-y"
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.content.length}/5000 characters
            </p>
          </div>

          {/* Spoiler Warning */}
          <div className="flex items-start gap-3">
            <Switch
              id="spoilers"
              checked={formData.hasSpoilers}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, hasSpoilers: checked }))
              }
            />
            <div className="space-y-1">
              <Label htmlFor="spoilers" className="flex items-center gap-2 cursor-pointer">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                This review contains spoilers
              </Label>
              <p className="text-xs text-muted-foreground">
                Check this if your review reveals plot details
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading || formData.rating === 0 || formData.content.trim().length < 10}
              className="flex-1"
            >
              {loading ? 'Saving...' : existingReview ? 'Update Review' : 'Publish Review'}
            </Button>
            {existingReview && (
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}