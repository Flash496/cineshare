// frontend/app/api/users/me/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    console.log('📥 /api/users/me called');
    console.log('✅ Token exists:', !!authHeader);

    if (!authHeader) {
      console.log('❌ No token provided');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Ensure Bearer prefix if not present
    const token = authHeader.startsWith('Bearer ')
      ? authHeader
      : `Bearer ${authHeader}`;

    console.log('🔐 Token format:', token.substring(0, 20) + '...');

    const response = await fetch(`${API_URL}/users/me`, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log('📤 Backend response status:', response.status);

    if (!response.ok) {
      console.log('❌ Backend returned error');
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ Backend error:', errorData);
      return NextResponse.json(
        { error: 'Failed to fetch user' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ User data retrieved:', data.username);
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error in /api/users/me:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
