// frontend/contexts/auth-context.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  register: (email: string, username: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check auth on mount
  useEffect(() => {
    console.log('🔵 Auth context mounted - checking auth...');
    checkAuth();
  }, []);

  // Re-check auth when app regains focus
  useEffect(() => {
    const handleFocus = () => {
      console.log('🟢 Window focused - refreshing auth...');
      checkAuth();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Refresh token before it expires
  useEffect(() => {
    if (!refreshToken) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (response.ok) {
          const data = await response.json();
          setAccessToken(data.accessToken);
          setRefreshToken(data.refreshToken);
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          console.log('🟢 Token refreshed successfully');
        } else {
          console.log('🔴 Token refresh failed');
          logout();
        }
      } catch (err) {
        console.error('🔴 Token refresh failed:', err);
        logout();
      }
    }, 13 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshToken]);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      console.log('🟡 Checking auth - Token exists:', !!token);

      if (!token) {
        console.log('🔴 No token found');
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        setIsLoading(false);
        return;
      }

      console.log('🟡 Fetching user data with token...');
      const response = await fetch('/api/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('🟢 User loaded successfully:', userData.username);
        setUser(userData);
        setAccessToken(token);
        setRefreshToken(localStorage.getItem('refreshToken'));
        setError(null);
      } else {
        console.log('🔴 Token invalid - clearing');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
      }
    } catch (err) {
      console.error('🔴 Auth check error:', err);
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, username: string, password: string) => {
    try {
      setError(null);
      console.log('🟡 Registering user...');
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Registration failed');
      }

      const { accessToken, refreshToken, user: userData } = await response.json();
      console.log('🟢 Registration successful');

      setUser(userData);
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Don't redirect immediately - let navbar re-render first
      setTimeout(() => router.push('/feed'), 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      console.error('🔴 Registration error:', message);
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      console.log('🟡 Logging in user...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Login failed');
      }

      const { accessToken, refreshToken, user: userData } = await response.json();
      console.log('🟢 Login successful:', userData.username);

      setUser(userData);
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Don't redirect immediately - let navbar re-render first
      setTimeout(() => router.push('/feed'), 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      console.error('🔴 Login error:', message);
      throw err;
    }
  };

  const logout = async () => {
    console.log('🟡 Logging out...');
    if (accessToken) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
      } catch (err) {
        console.error('🔴 Logout API call failed:', err);
      }
    }

    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/');
  };

  const refreshUser = async () => {
    console.log('🟡 Refreshing user...');
    await checkAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isLoading,
        error,
        register,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
