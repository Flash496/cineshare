'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode'; // npm install jwt-decode

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

// --- Helper to check token expiration ---
function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    return Date.now() >= exp * 1000 - 5000; // Expired if within 5s window
  } catch {
    return true;
  }
}

// --- Helper to get a valid (refreshed if needed) access token ---
const getValidAccessToken = async () => {
  let accessToken = localStorage.getItem('accessToken');
  let refreshToken = localStorage.getItem('refreshToken');

  if (!accessToken || isTokenExpired(accessToken)) {
    // Try to refresh via your API route
    if (!refreshToken) throw new Error('No refresh token');
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) throw new Error('Session expired. Please log in.');
    const { accessToken: newAccess, refreshToken: newRefresh } = await res.json();
    localStorage.setItem('accessToken', newAccess);
    localStorage.setItem('refreshToken', newRefresh);
    accessToken = newAccess;
  }
  return accessToken;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // --- Silent refresh effect ---
  useEffect(() => {
    async function silentRefresh() {
      try {
        const validToken = await getValidAccessToken();
        setAccessToken(validToken);
        setRefreshToken(localStorage.getItem('refreshToken'));
      } catch (err) {
        logout();
      }
    }
    const interval = setInterval(silentRefresh, 13 * 60 * 1000); // every 13 min
    return () => clearInterval(interval);
  }, [refreshToken]);

  // --- Auth check on mount and focus ---
  useEffect(() => { checkAuth(); }, []);
  useEffect(() => {
    const handleFocus = () => checkAuth();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // --- Main Auth Logic ---
  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const token = await getValidAccessToken();
      if (!token) throw new Error('No valid token');
      const response = await fetch('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setAccessToken(token);
        setRefreshToken(localStorage.getItem('refreshToken'));
        setError(null);
      } else {
        throw new Error('Token invalid or expired');
      }
    } catch (err) {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, username: string, password: string) => {
    setError(null);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Registration failed');
      const { accessToken, refreshToken, user: userData } = await response.json();
      setUser(userData);
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setTimeout(() => router.push('/feed'), 100);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Login failed');
      const { accessToken, refreshToken, user: userData } = await response.json();
      setUser(userData);
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setTimeout(() => router.push('/feed'), 100);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/');
  };

  const refreshUser = async () => await checkAuth();

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
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
