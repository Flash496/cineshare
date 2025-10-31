// frontend/app/movies/[id]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { MovieDetails } from '@/components/movies/movie-details';
import { MovieReviews } from '@/components/movies/movie-reviews';
import { SimilarMovies } from '@/components/movies/similar-movies';
import { ReviewForm } from '@/components/reviews/review-form';
import { QuickAddButton } from '@/components/watchlist/quick-add-button';
import { AddToWatchlistButton } from '@/components/watchlist/add-to-watchlist-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Calendar, Clock, Play } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

async function getMovieDetails(id: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // Fetch main movie details with append_to_response for all data
    const response = await fetch(`${apiUrl}/movies/${id}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.error(`Failed to fetch movie: ${response.status}`);
      return null;
    }

    const movie = await response.json();
    
    // Fetch additional data if needed
    const [creditsResponse, videosResponse, similarResponse] = await Promise.all([
      fetch(`${apiUrl}/movies/${id}/credits`).catch(() => null),
      fetch(`${apiUrl}/movies/${id}/videos`).catch(() => null),
      fetch(`${apiUrl}/movies/${id}/similar`).catch(() => null),
    ]);

    const credits = creditsResponse?.ok ? await creditsResponse.json() : null;
    const videos = videosResponse?.ok ? await videosResponse.json() : null;
    const similar = similarResponse?.ok ? await similarResponse.json() : null;

    return {
      ...movie,
      credits: credits || movie.credits,
      videos: videos || movie.videos,
      similar: similar || movie.similar,
    };
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const movie = await getMovieDetails(id);

  if (!movie) {
    return {
      title: 'Movie Not Found | CineShare',
    };
  }

  return {
    title: `${movie.title} (${new Date(movie.release_date).getFullYear()}) | CineShare`,
    description: movie.overview,
    openGraph: {
      title: movie.title,
      description: movie.overview,
      images: movie.poster_path ? [
        {
          url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
          width: 500,
          height: 750,
        }
      ] : [],
    },
  };
}

export default async function MoviePage({ params }: Props) {
  const { id } = await params;
  const movie = await getMovieDetails(id);
  
  if (!movie) {
    notFound();
  }

  const getImageUrl = (path: string | null, size: string = 'original') => {
    return path ? `https://image.tmdb.org/t/p/${size}${path}` : '/placeholder-movie.jpg';
  };

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatYear = (dateString: string) => {
    return dateString ? new Date(dateString).getFullYear() : 'TBA';
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[70vh] min-h-[500px]">
        {/* Backdrop Image */}
        {movie.backdrop_path && (
          <div className="absolute inset-0">
            <Image
              src={getImageUrl(movie.backdrop_path, 'original')}
              alt={movie.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>
        )}

        {/* Content */}
        <div className="container relative h-full mx-auto px-4 flex items-end pb-12">
          <div className="flex flex-col md:flex-row gap-8 w-full">
            {/* Poster */}
            <div className="flex-shrink-0">
              <div className="relative w-48 md:w-64 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src={getImageUrl(movie.poster_path, 'w500')}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                  {movie.title}
                </h1>
                {movie.tagline && (
                  <p className="text-lg text-muted-foreground italic">
                    "{movie.tagline}"
                  </p>
                )}
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {movie.vote_average > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{movie.vote_average.toFixed(1)}</span>
                    <span className="text-muted-foreground">/10</span>
                  </div>
                )}
                
                {movie.release_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatYear(movie.release_date)}</span>
                  </div>
                )}

                {movie.runtime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatRuntime(movie.runtime)}</span>
                  </div>
                )}
              </div>

              {/* Genres */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre: any) => (
                    <Badge key={genre.id} variant="secondary">
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <AddToWatchlistButton
                  movieId={movie.id}
                  movieTitle={movie.title}
                  posterPath={movie.poster_path}
                />
                
                <QuickAddButton
                  movieId={movie.id}
                  movieTitle={movie.title}
                  variant="outline"
                  size="default"
                  showLabel
                />

                {movie.videos?.results && movie.videos.results.length > 0 && (
                  <Button variant="outline" className="gap-2">
                    <Play className="h-4 w-4" />
                    Watch Trailer
                  </Button>
                )}
              </div>

              {/* Overview */}
              {movie.overview && (
                <div className="max-w-3xl">
                  <h2 className="text-xl font-semibold mb-2">Overview</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {movie.overview}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Additional Movie Details */}
        <MovieDetails movie={movie} />
        
        <div className="mt-12 space-y-12">
          {/* Write a Review Section */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Write a Review</h2>
            <ReviewForm
              movieId={movie.id}
              movieTitle={movie.title}
            />
          </section>

          {/* Reviews and Similar Movies */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <MovieReviews movieId={movie.id} />
            </div>
            <div className="lg:col-span-1">
              <SimilarMovies movies={movie.similar?.results || []} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}