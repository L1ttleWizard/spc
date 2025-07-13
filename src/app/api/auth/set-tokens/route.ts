import { NextRequest, NextResponse } from 'next/server';
import { storeSpotifyTokens } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken, expiresIn, userId } = await request.json();

    // Validate required fields
    if (!accessToken || !refreshToken || !expiresIn || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store tokens in Firestore
    await storeSpotifyTokens(userId, accessToken, refreshToken, expiresIn);

    // Create response with cookies
    const response = NextResponse.json({ 
      success: true,
      message: 'Tokens set successfully'
    });

    // Set secure cookies
    const isProduction = process.env.NODE_ENV === 'production';
    
    response.cookies.set('spotify_access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: expiresIn,
    });

    response.cookies.set('spotify_refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    response.cookies.set('user_id', userId, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    console.log('✅ Successfully set Spotify tokens from Firestore for user:', userId);
    return response;

  } catch (error) {
    console.error('❌ Error setting Spotify tokens:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to set tokens',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 