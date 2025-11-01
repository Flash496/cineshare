// frontend/lib/auth.ts
import { cookies } from 'next/headers';

export interface CurrentUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    if (!token) {
      return null;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export function getTokenFromCookies(cookieStore: any): string | null {
  return cookieStore.get('accessToken')?.value || null;
}