// src/lib/spotify-server.ts

import { cookies } from 'next/headers';
import SpotifyWebApi from 'spotify-web-api-node';

// Задержка между запросами для избежания rate limit
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // 100ms между запросами

async function delayIfNeeded() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  
  lastRequestTime = Date.now();
}

export async function getSpotifyServerApi(): Promise<SpotifyWebApi> {
  await delayIfNeeded();
  
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('spotify_access_token')?.value;
  const refreshToken = cookieStore.get('spotify_refresh_token')?.value;

  if (!accessToken) {
    throw new Error('No access token found');
  }

  const spotifyApi = new SpotifyWebApi({
    accessToken,
    refreshToken,
    clientId: process.env.SPOTIFY_CLIENT_ID!,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI!,
  });

  return spotifyApi;
}