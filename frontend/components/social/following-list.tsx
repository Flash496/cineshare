// frontend/components/social/following-list.tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { FollowButton } from './follow-button';
import { useAuth } from '@/contexts/auth-context';

interface Following {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  _count?: {
    followers: number;
    reviews: number;
  };
}

interface FollowingListProps {
  userId: string;
  label?: string;
  count?: number;
}

export function FollowingList({
  userId,
  label = 'Following',
  count = 0,
}: FollowingListProps) {
  const { user } = useAuth();
  const [following, setFollowing] = useState<Following[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (open) {
      fetchFollowing(1);
    }
  }, [open, userId]);

  const fetchFollowing = async (pageNum: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const response = await fetch(
        `${API_URL}/social/users/${userId}/following?page=${pageNum}&limit=20`,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (pageNum === 1) {
          setFollowing(data.following);
        } else {
          setFollowing((prev) => [...prev, ...data.following]);
        }
        setPage(pageNum);
        setHasMore(pageNum < data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to fetch following:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    fetchFollowing(page + 1);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <UserPlus className="h-4 w-4" />
          <span className="font-semibold">{count}</span>
          <span>{label}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>
            {following.length} users you follow
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {loading && following.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : following.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground text-sm">Not following anyone yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {following.map((followedUser) => (
                <div key={followedUser.id} className="flex items-start gap-3">
                  <Link
                    href={`/profile/${followedUser.username}`}
                    className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                    onClick={() => setOpen(false)}
                  >
                    <Avatar>
                      <AvatarImage src={followedUser.avatar} alt={followedUser.displayName} />
                      <AvatarFallback>
                        {followedUser.displayName[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {followedUser.displayName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        @{followedUser.username}
                      </p>
                      {followedUser.bio && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {followedUser.bio}
                        </p>
                      )}
                      {followedUser._count && (
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                          <span>{followedUser._count.followers} followers</span>
                          <span>•</span>
                          <span>{followedUser._count.reviews} reviews</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {user?.id !== followedUser.id && (
                    <FollowButton
                      userId={followedUser.id}
                      size="sm"
                      showLabel={false}
                      initialFollowing={true}
                    />
                  )}
                </div>
              ))}

              {hasMore && (
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}