import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Create response
    const response = NextResponse.json({ 
      success: true,
      message: 'User ID set successfully'
    });

    // Set user ID cookie
    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set('user_id', userId, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    console.log('✅ Successfully set user ID cookie:', userId);
    return response;

  } catch (error) {
    console.error('❌ Error setting user ID:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to set user ID',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 