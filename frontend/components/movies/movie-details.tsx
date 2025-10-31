// frontend/components/movies/movie-details.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Star, Clock, Calendar, Play, Plus, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MovieDetailsProps {
  movie: {
    id: number;
    title: string;
    original_title: string;
    overview: string;
    release_date: string;
    runtime: number;
    vote_average: number;
    vote_count: number;
    poster_path: string;
    backdrop_path: string;
    genres: Array<{ id: number; name: string }>;
    credits: {
      cast: Array<{
        id: number;
        name: string;
        character: string;
        profile_path: string;
      }>;
      crew: Array<{
        id: number;
        name: string;
        job: string;
        department: string;
      }>;
    };
    videos: {
      results: Array<{
        id: string;
        key: string;
        name: string;
        site: string;
        type: string;
      }>;
    };
  };
}

export function MovieDetails({ movie }: MovieDetailsProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatYear = (dateString: string) => {
    return new Date(dateString).getFullYear();
  };

  const getImageUrl = (path: string, size: string = 'w500') => {
    return path ? `https://image.tmdb.org/t/p/${size}${path}` : '/placeholder-movie.jpg';
  };

  const director = movie.credits?.crew?.find(person => person.job === 'Director');
  const trailer = movie.videos?.results?.find(video =>
    video.type === 'Trailer' && video.site === 'YouTube'
  );
  const mainCast = movie.credits?.cast?.slice(0, 8) || [];

  return (
    <div className="space-y-8">
      {/* Backdrop */}
      {movie.backdrop_path && (
        <div className="relative w-full h-[400px] md:h-[500px] -mt-8 -mx-4 md:mx-0 rounded-b-lg overflow-hidden">
          <Image
            src={getImageUrl(movie.backdrop_path, 'w1280')}
            alt={movie.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      )}

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Poster */}
          <div className="md:col-span-1">
            <Card className="overflow-hidden">
              <div className="relative aspect-2/3 w-full">
                <Image
                  src={getImageUrl(movie.poster_path, 'w500')}
                  alt={movie.title}
                  width={300}
                  height={450}
                  className={cn(
                    "object-cover transition-opacity duration-300",
                    imageLoaded ? "opacity-100" : "opacity-0"
                  )}
                  onLoad={() => setImageLoaded(true)}
                  priority
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-muted animate-pulse" />
                )}
              </div>
            </Card>
          </div>

          {/* Movie Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold">
                {movie.title}
              </h1>
              {movie.original_title !== movie.title && (
                <p className="text-xl text-muted-foreground">
                  {movie.original_title}
                </p>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatYear(movie.release_date)}</span>
                </div>
                {movie.runtime > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatRuntime(movie.runtime)}</span>
                  </div>
                )}
                {movie.vote_average > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{movie.vote_average.toFixed(1)}</span>
                    <span className="text-xs">({movie.vote_count.toLocaleString()} votes)</span>
                  </div>
                )}
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2">
                {movie.genres?.map((genre) => (
                  <Badge key={genre.id} variant="secondary">
                    {genre.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Overview */}
            {movie.overview && (
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Overview</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {movie.overview}
                </p>
              </div>
            )}

            {/* Director */}
            {director && (
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Directed by</h3>
                <p className="text-lg font-medium">{director.name}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {trailer && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Play className="h-4 w-4" />
                      Watch Trailer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <div className="aspect-video">
                      <iframe
                        src={`https://www.youtube.com/embed/${trailer.key}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full rounded-lg"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add to Watchlist
              </Button>

              <Button variant="outline" size="icon">
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Cast */}
        {mainCast.length > 0 && (
          <div className="mt-12 space-y-6">
            <h2 className="text-3xl font-bold">Cast</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {mainCast.map((actor) => (
                <Card key={actor.id} className="overflow-hidden">
                  <div className="relative aspect-2/3 w-full">
                    <Image
                      src={getImageUrl(actor.profile_path, 'w185')}
                      alt={actor.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-3">
                    <h4 className="font-medium text-sm line-clamp-1">
                      {actor.name}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {actor.character}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}