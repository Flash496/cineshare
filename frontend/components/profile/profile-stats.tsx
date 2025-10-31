// frontend/components/profile/profile-stats.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Star, TrendingUp, Award, Heart } from 'lucide-react';

interface ProfileStatsProps {
  stats: {
    moviesWatched: number;
    reviewsWritten: number;
    averageRating: number;
    totalLikes: number;
  };
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-500';
    if (rating >= 6) return 'text-blue-500';
    if (rating >= 4) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getReviewerLevel = (reviewCount: number) => {
    if (reviewCount >= 500) return { level: 'Legendary Critic', progress: 100 };
    if (reviewCount >= 250)
      return { level: 'Master Critic', progress: (reviewCount / 500) * 100 };
    if (reviewCount >= 100)
      return { level: 'Expert Critic', progress: (reviewCount / 250) * 100 };
    if (reviewCount >= 50)
      return { level: 'Advanced Critic', progress: (reviewCount / 100) * 100 };
    if (reviewCount >= 10)
      return { level: 'Novice Critic', progress: (reviewCount / 50) * 100 };
    return { level: 'Beginner', progress: (reviewCount / 10) * 100 };
  };

  const reviewerLevel = getReviewerLevel(stats.reviewsWritten);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={getRatingColor(stats.averageRating)}>
                <Star className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">Average Rating</span>
            </div>
            <span className="font-bold">{stats.averageRating.toFixed(1)}/10</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-sm">Movies Watched</span>
            </div>
            <span className="font-bold">{stats.moviesWatched}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <Award className="h-4 w-4 text-purple-500" />
              </div>
              <span className="text-sm">Reviews Written</span>
            </div>
            <span className="font-bold">{stats.reviewsWritten}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <Heart className="h-4 w-4 text-red-500" />
              </div>
              <span className="text-sm">Likes Received</span>
            </div>
            <span className="font-bold">{stats.totalLikes}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reviewer Level</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{reviewerLevel.level}</span>
            <span className="text-sm text-muted-foreground">{stats.reviewsWritten} reviews</span>
          </div>
          <Progress value={reviewerLevel.progress} className="h-2" />
          <p className="text-xs text-muted-foreground">Keep reviewing to level up!</p>
        </CardContent>
      </Card>
    </div>
  );
}