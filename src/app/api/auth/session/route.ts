import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = await cookieStore.get('spotify_access_token');

    if (!accessToken || !accessToken.value) {
      console.log('❌ No access token found in cookies');
      return NextResponse.json({ error: 'No access token found' }, { status: 401 });
    }

    console.log('✅ Access token found in session');
    return NextResponse.json({ accessToken: accessToken.value });
  } catch (error) {
    console.error('❌ Error in session route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}