import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSpotifyTokens } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    // Create response
    const response = NextResponse.json({ 
      success: true,
      message: 'Logged out successfully'
    });

    // Clear all authentication cookies
    response.cookies.set('spotify_access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    response.cookies.set('spotify_refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    response.cookies.set('user_id', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    // Delete tokens from Firestore if we have a user ID
    if (userId) {
      try {
        await deleteSpotifyTokens(userId);
        console.log('✅ Spotify tokens deleted from Firestore for user:', userId);
      } catch (firestoreError) {
        console.error('⚠️ Failed to delete tokens from Firestore, but continuing with logout:', firestoreError);
        // Don't fail the logout if Firestore deletion fails
      }
    }

    console.log('✅ Successfully logged out user');
    return response;

  } catch (error) {
    console.error('❌ Error during logout:', error);
    
    return NextResponse.json(
      { 
        error: 'Logout failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 