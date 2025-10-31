// frontend/components/navbar/navbar.tsx
'use client';

import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { NotificationBadge } from '@/components/notifications/notification-badge';
import { LogOut, LogIn, UserPlus, MessageCircle, Film } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { GlobalSearch } from './global-search';
import { useEffect, useState } from 'react';

export function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // ✅ FIX: Only render after component mounts
  useEffect(() => {
    console.log('📱 Navbar mounted');
    setMounted(true);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('📊 Navbar state:', { mounted, isLoading, userExists: !!user });
  }, [mounted, isLoading, user]);

  const handleLogout = () => {
    console.log('🔘 Logout clicked');
    logout();
    router.push('/');
  };

  // ✅ Show loading navbar while checking auth
  if (!mounted) {
    return (
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl shrink-0"
          >
            🎬 CineShare
          </Link>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </nav>
    );
  }

  // ✅ FIX: Check BOTH mounted AND isLoading
  if (isLoading) {
    return (
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl shrink-0"
          >
            🎬 CineShare
          </Link>
          <div className="text-sm text-muted-foreground">Checking auth...</div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16 gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-xl shrink-0"
        >
          🎬 CineShare
        </Link>

        {/* Center - Global Search */}
        <GlobalSearch />

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* ✅ CRITICAL: Check if user EXISTS (not just isLoading) */}
          {user ? (
            <>
              {/* Movies Button */}
              <Link href="/movies" title="Discover Movies">
                <Button variant="ghost" size="sm" className="gap-2 hidden sm:flex">
                  <Film className="h-4 w-4" />
                  Movies
                </Button>
              </Link>

              {/* Feed Link */}
              <Link href="/feed" title="Feed">
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  Feed
                </Button>
              </Link>

              {/* Direct Messages */}
              <Link href="/messages" title="Messages">
                <Button variant="ghost" size="icon">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </Link>

              {/* Notifications */}
              <NotificationBadge />

              {/* Profile Dropdown Menu - THIS IS THE PROFILE ICON */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    title={`Profile: ${user.displayName}`}
                  >
                    <Avatar className="h-8 w-8 border-2 border-primary">
                      <AvatarImage src={user.avatar} alt={user.displayName} />
                      <AvatarFallback className="text-xs font-bold bg-primary text-primary-foreground">
                        {user.displayName?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {/* User Info Header */}
                  <div className="px-2 py-1.5 text-sm font-semibold">
                    {user.displayName}
                  </div>
                  <div className="px-2 text-xs text-muted-foreground mb-2">
                    @{user.username}
                  </div>
                  <DropdownMenuSeparator />

                  {/* Profile Link */}
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${user.username}`} className="cursor-pointer">
                      👤 View Profile
                    </Link>
                  </DropdownMenuItem>

                  {/* Edit Profile */}
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/profile/${user.username}/edit`}
                      className="cursor-pointer"
                    >
                      ✏️ Edit Profile
                    </Link>
                  </DropdownMenuItem>

                  {/* Watchlists */}
                  <DropdownMenuItem asChild>
                    <Link href="/watchlists" className="cursor-pointer">
                      🎬 My Watchlists
                    </Link>
                  </DropdownMenuItem>

                  {/* Movies */}
                  <DropdownMenuItem asChild>
                    <Link href="/movies" className="cursor-pointer">
                      🍿 Discover Movies
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Settings */}
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      ⚙️ Settings
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Logout */}
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 cursor-pointer"
                  >
                    🚪 Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {/* Login */}
              <Link href="/auth/login" className="hidden sm:block">
                <Button variant="outline" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>

              {/* Register */}
              <Link href="/auth/register">
                <Button size="sm" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
