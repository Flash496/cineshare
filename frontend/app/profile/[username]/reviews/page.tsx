// frontend/app/profile/[username]/reviews/page.tsx/
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Heart, Share2, Flag, Calendar, Film } from 'lucide-react';
import { CommentList } from '@/components/comments/comment-list';
import { formatDistanceToNow } from 'date-fns';

async function getReview(reviewId: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/reviews/${reviewId}`,
      { 
        cache: 'no-store',
      }
    );

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Failed to fetch review:', error);
    return null;
  }
}

export default async function ReviewDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const review = await getReview(params.id);

  if (!review) {
    notFound();
  }

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? 'fill-yellow-500 text-yellow-500'
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Back Button */}
          <Link
            href={`/profile/${review.user.username}/reviews`}
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
          >
            ← Back to {review.user.displayName}'s Reviews
          </Link>

          {/* Movie Info Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-6">
                {review.movie.posterPath && (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${review.movie.posterPath}`}
                    alt={review.movie.title}
                    className="w-32 h-48 object-cover rounded-lg shadow-lg"
                  />
                )}
                <div className="flex-1 space-y-3">
                  <div>
                    <h1 className="text-3xl font-bold">{review.movie.title}</h1>
                    {review.movie.releaseDate && (
                      <p className="text-muted-foreground flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(review.movie.releaseDate).getFullYear()}
                      </p>
                    )}
                  </div>

                  {review.movie.genres && review.movie.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {review.movie.genres.map((genre: string) => (
                        <Badge key={genre} variant="secondary">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {review.movie.overview && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {review.movie.overview}
                    </p>
                  )}

                  <Link href={`/movies/${review.movie.tmdbId}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Film className="h-4 w-4" />
                      View Movie Details
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review Content */}
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Author Info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Link href={`/profile/${review.user.username}`}>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={review.user.avatar} />
                      <AvatarFallback>
                        {review.user.displayName[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <Link
                      href={`/profile/${review.user.username}`}
                      className="font-semibold hover:underline"
                    >
                      {review.user.displayName}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      @{review.user.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(review.createdAt), {
                        addSuffix: true,
                      })}
                      {review.createdAt !== review.updatedAt && ' (edited)'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Share2 className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Flag className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  {renderStars(review.rating)}
                  <span className="text-2xl font-bold">
                    {review.rating}/5
                  </span>
                </div>
              </div>

              {/* Review Title */}
              {review.title && (
                <div>
                  <h2 className="text-2xl font-bold">{review.title}</h2>
                </div>
              )}

              {/* Review Content */}
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                  {review.content}
                </p>
              </div>

              {/* Spoiler Warning */}
              {review.containsSpoilers && (
                <Badge variant="destructive" className="gap-1">
                  ⚠️ Contains Spoilers
                </Badge>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Heart className="h-4 w-4" />
                  {review._count?.likes || 0} Likes
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <div className="border-t pt-8">
            <CommentList reviewId={params.id} />
          </div>
        </div>
      </div>
    </div>
  );
}