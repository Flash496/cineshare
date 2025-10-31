// frontend/components/feed/feed-item.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Star,
  Heart,
  MessageCircle,
  UserPlus,
  List,
  ThumbsUp,
  MoreHorizontal,
  AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface FeedItemProps {
  item: {
    id: string;
    type: 'review' | 'follow' | 'watchlist' | 'like';
    actor: {
      id: string;
      username: string;
      displayName: string;
      avatar: string;
    };
    target: any;
    createdAt: string;
  };
}

export function FeedItem({ item }: FeedItemProps) {
  const [showSpoilers, setShowSpoilers] = useState(false);

  const renderContent = () => {
    switch (item.type) {
      case 'review':
        return <ReviewFeedItem item={item} showSpoilers={showSpoilers} setShowSpoilers={setShowSpoilers} />;
      case 'follow':
        return <FollowFeedItem item={item} />;
      case 'watchlist':
        return <WatchlistFeedItem item={item} />;
      case 'like':
        return <LikeFeedItem item={item} />;
      default:
        return null;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">{renderContent()}</CardContent>
    </Card>
  );
}

function ReviewFeedItem({ item, showSpoilers, setShowSpoilers }: any) {
  const { actor, target, createdAt } = item;
  const { review, movie } = target;
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(review._count?.likes || 0);

  const handleLike = async () => {
    // Optimistic update
    setLiked(!liked);
    setLikeCount((prev: number) => (liked ? prev - 1 : prev + 1));
    // TODO: Make API call
  };

  const getExcerpt = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <Link href={`/profile/${actor.username}`}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={actor.avatar} />
              <AvatarFallback>{actor.displayName[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <div className="flex items-center gap-1 flex-wrap">
              <Link href={`/profile/${actor.username}`} className="font-semibold hover:underline">
                {actor.displayName}
              </Link>
              <span className="text-muted-foreground">reviewed</span>
              <Link href={`/movies/${movie.id}`} className="font-semibold hover:underline">
                {movie.title}
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Review Content */}
      <div className="flex gap-4">
        <Link href={`/movies/${movie.id}`} className="flex-shrink-0">
          <Image
            src={movie.posterPath ? `https://image.tmdb.org/t/p/w185${movie.posterPath}` : '/placeholder-movie.png'}
            alt={movie.title}
            width={80}
            height={120}
            className="rounded-md object-cover"
          />
        </Link>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-bold text-lg">{review.rating}</span>
              <span className="text-sm text-muted-foreground">/10</span>
            </div>
          </div>

          {review.title && <h3 className="font-semibold text-lg">{review.title}</h3>}

          {review.hasSpoilers && !showSpoilers ? (
            <div className="space-y-2 p-3 border border-orange-500/20 rounded-lg bg-orange-500/5">
              <div className="flex items-center gap-2 text-orange-500">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">This review contains spoilers</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowSpoilers(true)}>
                Show Review
              </Button>
            </div>
          ) : (
            <p className="text-sm leading-relaxed">{getExcerpt(review.content)}</p>
          )}

          <Link
            href={`/reviews/${review.id}`}
            className="text-sm text-primary hover:underline mt-2 inline-block"
          >
            Read full review
          </Link>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-2', liked && 'text-red-500')}
          onClick={handleLike}
        >
          <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
          <span>{likeCount}</span>
        </Button>
        <Button variant="ghost" size="sm" className="gap-2">
          <MessageCircle className="h-4 w-4" />
          <span>{review._count?.comments || 0}</span>
        </Button>
      </div>
    </div>
  );
}

function FollowFeedItem({ item }: any) {
  const { actor, target, createdAt } = item;
  const followedUser = target.user;

  return (
    <div className="flex items-center gap-3">
      <Link href={`/profile/${actor.username}`}>
        <Avatar className="h-10 w-10">
          <AvatarImage src={actor.avatar} />
          <AvatarFallback>{actor.displayName[0]}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1">
        <div className="flex items-center gap-1 flex-wrap">
          <Link href={`/profile/${actor.username}`} className="font-semibold hover:underline">
            {actor.displayName}
          </Link>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">started following</span>
          <Link href={`/profile/${followedUser.username}`} className="font-semibold hover:underline">
            {followedUser.displayName}
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </p>
      </div>
      <Link href={`/profile/${followedUser.username}`}>
        <Avatar className="h-10 w-10">
          <AvatarImage src={followedUser.avatar} />
          <AvatarFallback>{followedUser.displayName[0]}</AvatarFallback>
        </Avatar>
      </Link>
    </div>
  );
}

function WatchlistFeedItem({ item }: any) {
  const { actor, target, createdAt } = item;
  const { watchlist, movie } = target;

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Link href={`/profile/${actor.username}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={actor.avatar} />
            <AvatarFallback>{actor.displayName[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div>
          <div className="flex items-center gap-1 flex-wrap">
            <Link href={`/profile/${actor.username}`} className="font-semibold hover:underline">
              {actor.displayName}
            </Link>
            <List className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">added to</span>
            <span className="font-semibold">{watchlist.name}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      {movie && (
        <div className="flex gap-3 items-center pl-13">
          <Image
            src={movie.posterPath ? `https://image.tmdb.org/t/p/w92${movie.posterPath}` : '/placeholder-movie.png'}
            alt={movie.title}
            width={46}
            height={69}
            className="rounded object-cover"
          />
          <div>
            <Link href={`/movies/${movie.id}`} className="font-medium hover:underline">
              {movie.title}
            </Link>
            <p className="text-sm text-muted-foreground">{movie.releaseYear}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function LikeFeedItem({ item }: any) {
  const { actor, target, createdAt } = item;
  const { review, movie } = target;

  return (
    <div className="flex gap-3">
      <Link href={`/profile/${actor.username}`}>
        <Avatar className="h-10 w-10">
          <AvatarImage src={actor.avatar} />
          <AvatarFallback>{actor.displayName[0]}</AvatarFallback>
        </Avatar>
      </Link>
      <div>
        <div className="flex items-center gap-1 flex-wrap">
          <Link href={`/profile/${actor.username}`} className="font-semibold hover:underline">
            {actor.displayName}
          </Link>
          <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">liked</span>
          <Link href={`/profile/${review.user.username}`} className="font-semibold hover:underline">
            {review.user.displayName}'s
          </Link>
          <span className="text-muted-foreground">review of</span>
          <Link href={`/movies/${movie.id}`} className="font-semibold hover:underline">
            {movie.title}
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}