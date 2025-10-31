// frontend/components/social/follow-button.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  userId: string;
  initialFollowing?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  userId,
  initialFollowing = false,
  variant = 'default',
  size = 'default',
  showLabel = true,
  onFollowChange,
}: FollowButtonProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const handleToggleFollow = async () => {
    if (!user) {
      toast.error('Please log in to follow users');
      window.location.href = '/auth/login';
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const endpoint = isFollowing ? 'unfollow' : 'follow';

      const response = await fetch(
        `${API_URL}/social/users/${userId}/${endpoint}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update follow status');
      }

      const newFollowingStatus = !isFollowing;
      setIsFollowing(newFollowingStatus);
      onFollowChange?.(newFollowingStatus);

      toast.success(
        newFollowingStatus
          ? 'You are now following this user'
          : 'You are no longer following this user'
      );
    } catch (error: any) {
      toast.error(error.message || 'Failed to update follow status');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;
  if (user.id === userId) return null; // Don't show for own profile

  return (
    <Button
      onClick={handleToggleFollow}
      disabled={loading}
      variant={isFollowing ? 'outline' : variant}
      size={size}
      className={cn(
        isFollowing && 'text-muted-foreground hover:text-foreground',
        size === 'icon' && 'w-10 h-10'
      )}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {showLabel && <span className="ml-2">Loading...</span>}
        </>
      ) : isFollowing ? (
        <>
          <UserCheck className="h-4 w-4" />
          {showLabel && <span className="ml-2">Following</span>}
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          {showLabel && <span className="ml-2">Follow</span>}
        </>
      )}
    </Button>
  );
}