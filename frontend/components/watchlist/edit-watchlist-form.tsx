// frontend/components/watchlist/edit-watchlist-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const watchlistFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Watchlist name is required.' })
    .max(100, { message: 'Watchlist name must not exceed 100 characters.' }),
  description: z
    .string()
    .max(500, { message: 'Description must not exceed 500 characters.' })
    .optional()
    .or(z.literal('')),
  isPublic: z.boolean(),
});

type WatchlistFormValues = z.infer<typeof watchlistFormSchema>;

interface EditWatchlistFormProps {
  watchlist: {
    id: string;
    name: string;
    description?: string | null;
    isPublic: boolean;
  };
}

export function EditWatchlistForm({ watchlist }: EditWatchlistFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<WatchlistFormValues>({
    resolver: zodResolver(watchlistFormSchema),
    defaultValues: {
      name: watchlist.name,
      description: watchlist.description || '',
      isPublic: watchlist.isPublic,
    },
  });

  const onSubmit = async (data: WatchlistFormValues) => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/watchlists/${watchlist.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update watchlist');
      }

      toast.success('Watchlist updated successfully');
      router.push(`/watchlists/${watchlist.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error updating watchlist:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update watchlist. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Watchlist Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Watchlist Name</FormLabel>
              <FormControl>
                <Input placeholder="My Favorite Movies" {...field} />
              </FormControl>
              <FormDescription>
                Give your watchlist a descriptive name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="A collection of movies I want to watch..."
                  className="resize-none"
                  rows={4}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Briefly describe what this watchlist is about. Max 500 characters.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Privacy Toggle */}
        <FormField
          control={form.control}
          name="isPublic"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Public Watchlist</FormLabel>
                <FormDescription>
                  Make this watchlist visible to other users. You can change this anytime.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/watchlists/${watchlist.id}`)}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}