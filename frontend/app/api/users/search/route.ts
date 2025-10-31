// frontend/app/api/users/search/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = searchParams.get('limit') || '5';

    if (!query || query.length < 2) {
      return NextResponse.json([], { status: 400 });
    }

    const token = request.headers.get('Authorization');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = token;

    const url = `${API_URL}/users/search?q=${encodeURIComponent(query)}&limit=${encodeURIComponent(limit)}`;

    const response = await fetch(url, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
