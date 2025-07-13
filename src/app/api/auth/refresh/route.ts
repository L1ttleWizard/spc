import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URLS, ERROR_MESSAGES } from '@/constants';
import { SPOTIFY_CONFIG } from '@/lib/spotify';
import { updateSpotifyTokens } from '@/lib/firebase';

/**
 * Refreshes Spotify access token using refresh token
 */
async function refreshAccessToken(refreshToken: string) {
  const credentials = Buffer.from(
    `${SPOTIFY_CONFIG.clientId}:${SPOTIFY_CONFIG.clientSecret}`
  ).toString('base64');

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch(API_URLS.SPOTIFY_TOKEN, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error_description || ERROR_MESSAGES.TOKEN_REFRESH_FAILED;
    
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('spotify_refresh_token')?.value;
    const userId = cookieStore.get('user_id')?.value; // We'll need to store user ID in a cookie

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token available' },
        { status: 401 }
      );
    }

    // Refresh the access token
    const tokenData = await refreshAccessToken(refreshToken);
    const { access_token, expires_in } = tokenData;

    if (!access_token) {
      throw new Error('Invalid token response from Spotify');
    }

    // Create response
    const response = NextResponse.json({ 
      success: true,
      access_token,
      expires_in 
    });

    // Set new access token cookie
    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set('spotify_access_token', access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: expires_in,
    });

    // Update tokens in Firestore if we have a user ID
    if (userId) {
      try {
        await updateSpotifyTokens(userId, access_token, expires_in);
        console.log('✅ Updated Spotify tokens in Firestore for user:', userId);
      } catch (firestoreError) {
        console.error('⚠️ Failed to update tokens in Firestore, but continuing with cookie update:', firestoreError);
        // Don't fail the entire flow if Firestore update fails
      }
    }

    console.log('✅ Successfully refreshed Spotify access token');
    return response;

  } catch (error) {
    console.error('❌ Error refreshing Spotify token:', error);
    
    return NextResponse.json(
      { 
        error: 'Token refresh failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 