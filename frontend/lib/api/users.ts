// frontend/lib/api/users.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getUserProfile(username: string): Promise<User | null> {
  try {
    const response = await fetch(`${API_URL}/users/${username}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch user profile');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function updateUserProfile(
  username: string,
  data: Partial<User>,
  token: string
): Promise<User> {
  const response = await fetch(`${API_URL}/users/${username}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update profile');
  }

  return response.json();
}