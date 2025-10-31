// frontend/components/profile/profile-activity.tsx
'use client';

import { useEffect, useState } from 'react';
import { ReviewCard } from '@/components/reviews/review-card';
import { Loader2 } from 'lucide-react';

interface ProfileActivityProps {
  username: string;
  type: 'reviews' | 'watchlists' | 'activity';
}

export function ProfileActivity({ username, type }: ProfileActivityProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/${username}/${type}`
        );
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [username, type]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No {type} yet</p>
      </div>
    );
  }

  if (type === 'reviews') {
    return (
      <div className="space-y-4">
        {data.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    );
  }

  // Placeholder for watchlists and activity
  return (
    <div className="grid gap-4">
      {data.map((item) => (
        <div key={item.id} className="border rounded-lg p-4">
          <h3 className="font-semibold">{item.name || item.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {item.description || 'No description'}
          </p>
        </div>
      ))}
    </div>
  );
}
