// frontend/lib/api/watchlists.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface WatchlistMovie {
  id: string;
  movieId: number;
  order: number;
  watched: boolean;
  notes?: string;
  title: string;
  posterPath?: string;
  releaseDate?: string;
  rating?: number;
}

export interface Watchlist {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  _count: {
    movies: number;
  };
}

/**
 * Fetch a single watchlist by ID
 */
export async function getWatchlist(id: string): Promise<Watchlist | null> {
  try {
    const response = await fetch(`${API_URL}/watchlists/${id}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 403) {
        return null;
      }
      throw new Error('Failed to fetch watchlist');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return null;
  }
}

/**
 * Fetch movies in a watchlist
 */
export async function getWatchlistMovies(id: string): Promise<WatchlistMovie[]> {
  try {
    const response = await fetch(`${API_URL}/watchlists/${id}/movies`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch watchlist movies');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching watchlist movies:', error);
    return [];
  }
}

/**
 * Fetch all watchlists for a user
 */
export async function getUserWatchlists(userId: string): Promise<Watchlist[]> {
  try {
    const response = await fetch(`${API_URL}/watchlists/user/${userId}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user watchlists');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching user watchlists:', error);
    return [];
  }
}

/**
 * Create a new watchlist
 */
export async function createWatchlist(
  data: {
    name: string;
    description?: string;
    isPublic: boolean;
  },
  token: string
): Promise<Watchlist> {
  const response = await fetch(`${API_URL}/watchlists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create watchlist');
  }

  return response.json();
}

/**
 * Update a watchlist
 */
export async function updateWatchlist(
  id: string,
  data: {
    name?: string;
    description?: string;
    isPublic?: boolean;
  },
  token: string
): Promise<Watchlist> {
  const response = await fetch(`${API_URL}/watchlists/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update watchlist');
  }

  return response.json();
}

/**
 * Delete a watchlist
 */
export async function deleteWatchlist(id: string, token: string): Promise<void> {
  const response = await fetch(`${API_URL}/watchlists/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete watchlist');
  }
}