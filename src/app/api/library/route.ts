import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserLibrary } from '@/data/spotify';
import { LibrarySortType, LibraryFilterType } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const cookieStore = await cookies();
    const hasToken = cookieStore.has('spotify_access_token');
    
    if (!hasToken) {
      return NextResponse.json(
        { error: 'Not authenticated', authenticated: false },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') as LibrarySortType | null;
    const filter = searchParams.get('filter') as LibraryFilterType | null;

    const libraryData = await getUserLibrary(sort || undefined, filter || undefined);

    if (!libraryData) {
      return NextResponse.json(
        { error: 'Failed to fetch library data', authenticated: true },
        { status: 500 }
      );
    }

    return NextResponse.json(libraryData);
  } catch (error) {
    console.error('Library API error:', error);
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('access token')) {
      return NextResponse.json(
        { error: 'Not authenticated', authenticated: false },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', authenticated: true },
      { status: 500 }
    );
  }
} 