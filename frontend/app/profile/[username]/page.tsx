// frontend/app/profile/[username]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProfileHeader } from '../../../components/profile/profile-header';
import { ProfileStats } from '@/components/profile/profile-stats';
import { ProfileActivity } from '../../../components/profile/profile-activity';
import { FollowersList } from '@/components/social/followers-list';
import { FollowingList } from '@/components/social/following-list';
import { FollowButton } from '@/components/social/follow-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  params: { username: string };
}

async function getUserProfile(username: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${username}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    return null;
  }
}

async function getUserStats(username: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${username}/stats`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await getUserProfile(params.username);

  if (!user) {
    return { title: 'User Not Found | CineShare' };
  }

  return {
    title: `${user.displayName || user.username} (@${user.username}) | CineShare`,
    description: user.bio || `Check out ${user.displayName || user.username}'s movie reviews on CineShare`,
  };
}

export default async function ProfilePage({ params }: Props) {
  const [user, stats] = await Promise.all([
    getUserProfile(params.username),
    getUserStats(params.username),
  ]);

  if (!user) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileHeader user={user} stats={stats} />

      {/* Social Stats Bar */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <FollowersList
                userId={user.id}
                label="Followers"
                count={stats?.followersCount || 0}
              />
              <FollowingList
                userId={user.id}
                label="Following"
                count={stats?.followingCount || 0}
              />
            </div>
            <FollowButton
              userId={user.id}
              variant="default"
              size="default"
              showLabel={true}
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <ProfileStats stats={stats} />
          </div>

          <div className="lg:col-span-2">
            <Tabs defaultValue="reviews" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="reviews" className="flex-1">
                  Reviews
                </TabsTrigger>
                <TabsTrigger value="watchlists" className="flex-1">
                  Watchlists
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex-1">
                  Activity
                </TabsTrigger>
              </TabsList>

              <TabsContent value="reviews" className="mt-6">
                <ProfileActivity username={params.username} type="reviews" />
              </TabsContent>

              <TabsContent value="watchlists" className="mt-6">
                <ProfileActivity username={params.username} type="watchlists" />
              </TabsContent>

              <TabsContent value="activity" className="mt-6">
                <ProfileActivity username={params.username} type="activity" />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}