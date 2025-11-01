// frontend/app/profile/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import Link from 'next/link';

const profileFormSchema = z.object({
  displayName: z
    .string()
    .min(2, { message: 'Display name must be at least 2 characters.' })
    .max(50, { message: 'Display name must not exceed 50 characters.' }),
  bio: z
    .string()
    .max(500, { message: 'Bio must not exceed 500 characters.' })
    .optional()
    .or(z.literal('')),
  avatar: z
    .string()
    .url({ message: 'Please enter a valid URL.' })
    .optional()
    .or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function EditProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: '',
      bio: '',
      avatar: '',
    },
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Load user data into form
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          form.reset({
            displayName: userData.displayName || '',
            bio: userData.bio || '',
            avatar: userData.avatar || '',
          });
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsFetching(false);
      }
    };

    loadUserData();
  }, [user, router, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      toast.success('Profile updated successfully');
      router.push(`/profile/${user?.username}`);
      router.refresh();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update profile. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (isFetching) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/profile/${user.username}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Profile</h1>
            <p className="text-muted-foreground">
              Update your profile information
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Display Name */}
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormDescription>
                        This is your public display name.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bio */}
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about yourself..."
                          className="resize-none"
                          rows={4}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        A short description about you. Max 500 characters.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Avatar URL */}
                <FormField
                  control={form.control}
                  name="avatar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar URL (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/avatar.jpg"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter a URL to your profile picture.
                      </FormDescription>
                      <FormMessage />
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
                    onClick={() => router.push(`/profile/${user.username}`)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}