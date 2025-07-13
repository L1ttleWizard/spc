// src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { SPOTIFY_CONFIG } from '@/lib/spotify';
import { SPOTIFY_SCOPES } from '@/constants';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  // Create state parameter with user ID for callback
  const state = userId ? `user_id=${userId}` : '';

  // Build Spotify authorization URL with state parameter
  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.set('client_id', SPOTIFY_CONFIG.clientId || '');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', SPOTIFY_CONFIG.redirectUri || '');
  authUrl.searchParams.set('scope', SPOTIFY_SCOPES.join(' '));
  
  if (state) {
    authUrl.searchParams.set('state', state);
  }

  return NextResponse.redirect(authUrl.toString());
}