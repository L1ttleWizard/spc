import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth) {
    return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
  }

  try {
    const spotifyRes = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=20', {
      headers: { Authorization: auth },
    });
    const data = await spotifyRes.json();
    return NextResponse.json(data, { status: spotifyRes.status });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch from Spotify', details: String(err) }, { status: 500 });
  }
} 