// frontend/components/social/user-discovery.tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Zap, Users } from 'lucide-react';
import Link from 'next/link';
import { FollowButton } from './follow-button';
import { useAuth } from '@/contexts/auth-context';

interface DiscoveredUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isVerified?: boolean;
  _count?: {
    followers: number;
    reviews: number;
  };
  reason?: string; // Why they're suggested
}

export function UserDiscovery() {
  const { user } = useAuth();
  const [suggestedUsers, setSuggestedUsers] = useState<DiscoveredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSuggestedUsers();
    }
  }, [user]);

  const fetchSuggestedUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const response = await fetch(
        `${API_URL}/social/suggested-users?limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuggestedUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch suggested users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSuggestedUsers();
    setRefreshing(false);
  };

  const handleUserAdded = (userId: string) => {
    setSuggestedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Discover People
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : suggestedUsers.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground text-sm text-center">
              No more suggestions. Try following more users!
            </p>
          </div>
        ) : (
          suggestedUsers.map((suggestedUser) => (
            <div key={suggestedUser.id} className="flex items-start gap-3">
              <Link
                href={`/profile/${suggestedUser.username}`}
                className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
              >
                <Avatar>
                  <AvatarImage
                    src={suggestedUser.avatar}
                    alt={suggestedUser.displayName}
                  />
                  <AvatarFallback>
                    {suggestedUser.displayName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">
                      {suggestedUser.displayName}
                    </p>
                    {suggestedUser.isVerified && (
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        ✓
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground truncate">
                    @{suggestedUser.username}
                  </p>

                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                    <span>{suggestedUser._count?.followers || 0} followers</span>
                    <span>•</span>
                    <span>{suggestedUser._count?.reviews || 0} reviews</span>
                  </div>

                  {suggestedUser.reason && (
                    <p className="text-xs text-blue-500 mt-1 line-clamp-1">
                      {suggestedUser.reason}
                    </p>
                  )}
                </div>
              </Link>

              <FollowButton
                userId={suggestedUser.id}
                size="sm"
                showLabel={false}
                onFollowChange={() => handleUserAdded(suggestedUser.id)}
              />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}