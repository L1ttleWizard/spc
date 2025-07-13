import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = await cookieStore.get('spotify_access_token');

    if (!accessToken || !accessToken.value) {
      // Don't log this as an error since it's expected when user hasn't connected Spotify
      return NextResponse.json({ 
        authenticated: false,
        message: 'No Spotify tokens found - user needs to connect Spotify'
      }, { status: 401 });
    }

    return NextResponse.json({ 
      authenticated: true,
      accessToken: accessToken.value 
    });
  } catch (error) {
    console.error('❌ Error in session route:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      authenticated: false
    }, { status: 500 });
  }
}