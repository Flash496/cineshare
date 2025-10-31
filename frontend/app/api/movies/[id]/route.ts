// frontend/app/api/movies/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if it's a special endpoint (trending, popular, etc.) or a movie ID
    const specialEndpoints = ['trending', 'popular', 'top-rated', 'upcoming', 'now-playing'];
    
    if (specialEndpoints.includes(id)) {
      // It's an endpoint like "trending" or "popular"
      const searchParams = request.nextUrl.searchParams;
      const queryString = searchParams.toString();
      const url = `${BACKEND_URL}/movies/${id}${queryString ? `?${queryString}` : ''}`;

      console.log(`[API Route] Fetching endpoint: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      console.log(`[API Route] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[API Route] Backend error: ${errorText}`);
        throw new Error(`Backend responded with status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[API Route] Successfully fetched data`);
      return NextResponse.json(data);
    } else {
      // It's a movie ID - cache for 1 hour
      const url = `${BACKEND_URL}/movies/${id}`;

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 3600 }, // Revalidate every 1 hour
      });

      if (!response.ok) {
        throw new Error(`Backend responded with status: ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('[API Route] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch movie', 
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}