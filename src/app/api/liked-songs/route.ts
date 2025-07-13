import { NextResponse } from 'next/server';
import { getLikedSongs } from '@/data/spotify';
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
        { 
          error: 'Spotify connection required',
          authenticated: false,
          message: 'Please connect your Spotify account to view your liked songs'
        },
        { status: 401 }
      );
    }

    console.log('🎵 API: Fetching liked songs...');
    
    const likedSongsData = await getLikedSongs();
    
    if (!likedSongsData) {
      return NextResponse.json(
        { error: 'Failed to fetch liked songs' },
        { status: 500 }
      );
    }

    // Transform to playlist format
    const playlistData = {
      id: 'liked-songs',
      name: 'Liked Songs',
      description: `Your ${likedSongsData.total} liked songs`,
      images: [{ url: '/heart-playlist.svg' }],
      owner: { display_name: 'You' },
      followers: { total: likedSongsData.total },
      tracks: {
        items: likedSongsData.items.map(item => ({
          track: item.track,
          added_at: item.added_at
        }))
      }
    };

    console.log(`✅ API: Successfully returned ${likedSongsData.total} liked songs`);
    
    return NextResponse.json(playlistData);
    
  } catch (error) {
    console.error('❌ API: Error fetching liked songs:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 