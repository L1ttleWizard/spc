import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // Check authentication - try Authorization header first, then cookies
    const authHeader = request.headers.get('authorization');
    let accessToken: string | undefined;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
    } else {
      const cookieStore = await cookies();
      const tokenCookie = cookieStore.get('spotify_access_token');
      accessToken = tokenCookie?.value;
    }
    
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log('🎵 API: Fetching liked songs batch:', { offset, limit });
    
    // Fetch batch from Spotify API
    const response = await fetch(
      `https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }

    const spotifyData = await response.json();
    
    // Transform tracks to our format
    const tracks = spotifyData.items.map((item: any) => item.track).filter(Boolean);
    
    const result = {
      success: true,
      tracks,
      total: spotifyData.total,
      offset,
      limit,
      hasMore: offset + limit < spotifyData.total,
    };

    console.log(`✅ API: Successfully returned batch of ${tracks.length} liked songs (${offset + tracks.length}/${spotifyData.total})`);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ API: Error fetching liked songs batch:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 