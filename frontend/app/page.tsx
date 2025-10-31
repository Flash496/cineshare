// frontend/app/page.tsx
'use client';

import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MovieCarousel } from '@/components/movies/movie-carousel';
import { MovieSearch } from '@/components/movies/movie-search';
import { ArrowRight, Film, Star, Users } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-20">
        <div className="container mx-auto px-4 space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold text-center">
            Discover, Review, Share
          </h1>
          <p className="text-xl md:text-2xl text-center max-w-3xl mx-auto opacity-90">
            Discover, review, and share your favorite movies with fellow cinephiles
          </p>

          {/* Call to Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            {!user ? (
              <>
                <Link href="/auth/register">
                  <Button size="lg" variant="secondary" className="gap-2">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 border-white/30">
                    Sign In
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/feed">
                <Button size="lg" variant="secondary" className="gap-2">
                  Go to Feed
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto pt-4">
            <MovieSearch />
          </div>
        </div>
      </section>

      {/* Features Section */}
      {!user && (
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Why CineShare?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Film className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Discover Movies</h3>
                <p className="text-muted-foreground">
                  Explore trending and popular movies from around the world
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Write Reviews</h3>
                <p className="text-muted-foreground">
                  Share your thoughts and rate movies you've watched
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Connect with Fans</h3>
                <p className="text-muted-foreground">
                  Follow other cinephiles and discuss your favorite films
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Movie Carousels */}
      <div className="container mx-auto px-4 py-12 space-y-12">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Trending Now</h2>
            <Link href="/movies/trending">
              <Button variant="ghost" className="gap-2">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <MovieCarousel title="Trending Now" endpoint="trending" />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Popular Movies</h2>
            <Link href="/movies/popular">
              <Button variant="ghost" className="gap-2">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <MovieCarousel title="Popular Movies" endpoint="popular" />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Top Rated</h2>
            <Link href="/movies/top-rated">
              <Button variant="ghost" className="gap-2">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <MovieCarousel title="Top Rated" endpoint="top-rated" />
        </section>
      </div>

      {/* Call to Action Footer */}
      {!user && (
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Start Your Movie Journey?
            </h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Join thousands of movie lovers sharing their passion for cinema
            </p>
            <Link href="/auth/register">
              <Button size="lg" variant="secondary" className="gap-2">
                Sign Up Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}