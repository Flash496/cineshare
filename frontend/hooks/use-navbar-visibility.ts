// frontend/hooks/use-navbar-visibility.ts
import { usePathname } from 'next/navigation';

export function useNavbarVisibility() {
  const pathname = usePathname();

  // Paths where navbar should be hidden
  const hiddenPaths = [
    '/auth/login',
    '/auth/register',
    '/auth/callback',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/',
    '/onboarding',
    '/welcome',
  ];

  // Check exact match or pattern match
  const shouldHide = hiddenPaths.some((path) => {
    // Exact match
    if (pathname === path) return true;
    
    // Pattern match (e.g., /auth/reset-password/[token])
    if (pathname.startsWith(path + '/')) return true;
    
    return false;
  });

  return !shouldHide;
}
