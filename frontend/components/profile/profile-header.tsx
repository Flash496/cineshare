// frontend/components/profile/profile-header.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  Settings,
  UserPlus,
  UserCheck,
  Share2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { EditProfileDialog } from './edit-profile-dialog';
import { cn } from '@/lib/utils';

interface ProfileHeaderProps {
  user: {
    id: string;
    username: string;
    displayName: string;
    bio: string;
    avatar: string;
    location: string;
    website: string;
    favoriteGenre: string;
    isVerified: boolean;
    createdAt: string;
    _count: {
      followers: number;
      following: number;
      reviews: number;
    };
  };
  stats: {
    moviesWatched: number;
    reviewsWritten: number;
    followers: number;
    following: number;
  };
}

export function ProfileHeader({ user, stats }: ProfileHeaderProps) {
  const { user: currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false); // Should be synced with backend status ideally
  const [followLoading, setFollowLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const isOwnProfile = currentUser?.id === user.id;

  const handleFollowToggle = async () => {
    if (!currentUser) {
      window.location.href = '/auth/login';
      return;
    }
    setFollowLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      const response = await fetch(`/api/users/${user.id}/${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setIsFollowing(!isFollowing);
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className="space-y-6">
      {/* Cover Background */}
      <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg" />

      <div className="container mx-auto px-4">
        <Card className="relative -mt-20 p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="shrink-0">
              <div className="relative h-32 w-32">
                <Image
                  src={user.avatar || '/default-avatar.png'}
                  alt={user.displayName}
                  fill
                  className="rounded-full object-cover border-4 border-background"
                />
                {user.isVerified && (
                  <div className="absolute bottom-0 right-0 bg-background rounded-full p-1">
                    <CheckCircle2 className="h-6 w-6 text-blue-500" />
                  </div>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-3xl font-bold">{user.displayName}</h1>
                    {user.isVerified && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">@{user.username}</p>
                  {user.bio && <p className="text-sm mt-2">{user.bio}</p>}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {user.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{user.location}</span>
                      </div>
                    )}
                    {user.website && (
                      <a
                        href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:underline"
                      >
                        <LinkIcon className="h-4 w-4" />
                        <span>Website</span>
                      </a>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                  {user.favoriteGenre && (
                    <div>
                      <Badge variant="outline">Favorite Genre: {user.favoriteGenre}</Badge>
                    </div>
                  )}
                  {/* Stats */}
                  <div className="flex gap-6 pt-2">
                    <div>
                      <p className="font-bold text-lg">{stats.moviesWatched}</p>
                      <p className="text-sm text-muted-foreground">Movies</p>
                    </div>
                    <div>
                      <p className="font-bold text-lg">{stats.reviewsWritten}</p>
                      <p className="text-sm text-muted-foreground">Reviews</p>
                    </div>
                    <div>
                      <p className="font-bold text-lg">{stats.followers}</p>
                      <p className="text-sm text-muted-foreground">Followers</p>
                    </div>
                    <div>
                      <p className="font-bold text-lg">{stats.following}</p>
                      <p className="text-sm text-muted-foreground">Following</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setEditDialogOpen(true)}
                      >
                        <Settings className="h-4 w-4" />
                        Edit Profile
                      </Button>
                      <Button variant="outline" size="icon">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        className={cn('gap-2', isFollowing && 'bg-muted hover:bg-muted/90')}
                        onClick={handleFollowToggle}
                        disabled={followLoading}
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck className="h-4 w-4" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            Follow
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="icon">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {isOwnProfile && (
        <EditProfileDialog
          user={user}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      )}
    </div>
  );
}
