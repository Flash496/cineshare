// frontend/components/profile/edit-profile-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const profileFormSchema = z.object({
  displayName: z
    .string()
    .min(2, { message: 'Display name must be at least 2 characters.' })
    .max(50, { message: 'Display name must not exceed 50 characters.' }),
  bio: z
    .string()
    .max(500, { message: 'Bio must not exceed 500 characters.' })
    .optional(),
  location: z
    .string()
    .max(100, { message: 'Location must not exceed 100 characters.' })
    .optional(),
  website: z
    .string()
    .url({ message: 'Please enter a valid URL.' })
    .optional()
    .or(z.literal('')),
  avatar: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileFormProps {
  user: {
    id: string;
    username: string;
    displayName: string;
    bio?: string;
    location?: string;
    website?: string;
    avatar?: string;
  };
}

export function EditProfileForm({ user }: EditProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || '');

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: user.displayName || '',
      bio: user.bio || '',
      location: user.location || '',
      website: user.website || '',
      avatar: user.avatar || '',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`/api/users/${user.username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      toast.success('Profile updated', {
        description: 'Your profile has been updated successfully.',
      });

      router.push(`/profile/${user.username}`);
      router.refresh();
    } catch (error) {
      toast.error('Failed to update profile', {
        description: 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you'd upload this to a service like Cloudinary or S3
      // For now, we'll use a local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
        form.setValue('avatar', result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarPreview} />
            <AvatarFallback className="text-2xl">
              {user.displayName?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <label htmlFor="avatar-upload">
              <Button type="button" variant="outline" size="sm" asChild>
                <span className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </span>
              </Button>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              JPG, PNG or GIF. Max size 2MB.
            </p>
          </div>
        </div>

        {/* Display Name */}
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name. It can be your real name or a pseudonym.
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
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about yourself and your taste in movies..."
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Brief description for your profile. Max 500 characters.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Location */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="New York, NY" {...field} />
              </FormControl>
              <FormDescription>Your city or region (optional)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Website */}
        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input placeholder="https://yourwebsite.com" {...field} />
              </FormControl>
              <FormDescription>
                Your personal website or social media link (optional)
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
  );
}