import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const hasAccessToken = cookieStore.has('spotify_access_token');
    const hasRefreshToken = cookieStore.has('spotify_refresh_token');
    const userId = cookieStore.get('user_id')?.value;
    
    // Get token values (without exposing them in logs)
    const accessToken = cookieStore.get('spotify_access_token')?.value;
    const refreshToken = cookieStore.get('spotify_refresh_token')?.value;
    
    const status = {
      authenticated: hasAccessToken && hasRefreshToken,
      hasAccessToken,
      hasRefreshToken,
      hasUserId: !!userId,
      userId,
      accessTokenLength: accessToken?.length || 0,
      refreshTokenLength: refreshToken?.length || 0,
      timestamp: new Date().toISOString(),
    };
    
    console.log('🔍 Auth status check:', {
      authenticated: status.authenticated,
      hasAccessToken: status.hasAccessToken,
      hasRefreshToken: status.hasRefreshToken,
      hasUserId: status.hasUserId,
      accessTokenLength: status.accessTokenLength,
      refreshTokenLength: status.refreshTokenLength,
    });
    
    return NextResponse.json(status);
  } catch (error) {
    console.error('❌ Error checking auth status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check authentication status',
        authenticated: false,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
} 