/**
 * Spotify OAuth callback handler
 */

import { NextRequest, NextResponse } from 'next/server';
import { API_URLS, ERROR_MESSAGES } from '@/constants';
import { SPOTIFY_CONFIG } from '@/lib/spotify';
import { handleError, ErrorType, logError } from '@/lib/error-handler';

/**
 * Exchanges authorization code for access and refresh tokens
 */
async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const credentials = Buffer.from(
    `${SPOTIFY_CONFIG.clientId}:${SPOTIFY_CONFIG.clientSecret}`
  ).toString('base64');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
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
    const errorMessage = errorData.error_description || ERROR_MESSAGES.TOKEN_EXCHANGE_FAILED;
    
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Sets secure HTTP-only cookies for tokens using Next.js native cookie handling
 */
function setTokenCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): NextResponse {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Set access token cookie
  response.cookies.set('spotify_access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: expiresIn,
  });

  // Set refresh token cookie
  response.cookies.set('spotify_refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://127.0.0.1:3000';
  const redirectUri = SPOTIFY_CONFIG.redirectUri;

  const redirectWithError = (errorType: string) => {
    return NextResponse.redirect(`${baseUrl}?error=${errorType}`);
  };

  // Handle OAuth errors
  if (error) {
    logError({
      type: ErrorType.AUTHENTICATION,
      message: `Spotify OAuth error: ${error}`,
      context: { error, state },
    });
    return redirectWithError('spotify_auth_failed');
  }

  // Validate authorization code
  if (!code) {
    logError({
      type: ErrorType.VALIDATION,
      message: 'No authorization code received',
      context: { state },
    });
    return redirectWithError('spotify_no_code');
  }

  try {
    // Exchange code for tokens
    const tokenData = await exchangeCodeForTokens(code, redirectUri);
    const { access_token, refresh_token, expires_in } = tokenData;

    if (!access_token || !refresh_token) {
      throw new Error('Invalid token response from Spotify');
    }

    // Create redirect response
    const response = NextResponse.redirect(baseUrl);
    
    // Set secure cookies using Next.js native method
    setTokenCookies(response, access_token, refresh_token, expires_in);

    console.log('✅ Successfully set Spotify tokens in cookies');
    return response;

  } catch (err) {
    handleError(err, {
      code,
      redirectUri,
      baseUrl,
    });

    return redirectWithError('spotify_token_exchange_failed');
  }
}
