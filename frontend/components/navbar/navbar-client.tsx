// frontend/components/navbar/navbar-client.tsx
'use client';

import { useNavbarVisibility } from '@/hooks/use-navbar-visibility';
import { Navbar } from './navbar';

export function NavbarClient() {
  const showNavbar = useNavbarVisibility();

  if (!showNavbar) {
    return null;
  }

  return <Navbar />;
}
