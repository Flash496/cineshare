// frontend/app/api/movies/search/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const token = request.headers.get('Authorization');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = token;

    const url = `${API_URL}/movies/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error searching movies:', error);
    return NextResponse.json(
      {
        error: 'Failed to search movies',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
