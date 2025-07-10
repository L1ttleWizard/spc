/**
 * Server-side Spotify API utilities with rate limiting and error handling
 */

import { cookies } from 'next/headers';
import SpotifyWebApi from 'spotify-web-api-node';
import { RATE_LIMIT, ERROR_MESSAGES } from '@/constants';
import { SPOTIFY_CONFIG } from '@/lib/spotify';
import { SpotifyError, ErrorType, withRetry } from '@/lib/error-handler';

// Rate limiting state
let lastRequestTime = 0;

/**
 * Implements rate limiting to avoid API limits
 */
async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT.MIN_REQUEST_INTERVAL) {
    const delay = RATE_LIMIT.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastRequestTime = Date.now();
}

/**
 * Retrieves access and refresh tokens from cookies
 */
async function getTokensFromCookies(): Promise<{
  accessToken: string;
  refreshToken?: string;
}> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('spotify_access_token')?.value;
  const refreshToken = cookieStore.get('spotify_refresh_token')?.value;

  if (!accessToken) {
    throw new SpotifyError(
      ErrorType.AUTHENTICATION,
      ERROR_MESSAGES.NO_ACCESS_TOKEN,
      new Error('Access token not found in cookies'),
      { hasRefreshToken: !!refreshToken }
    );
  }

  return { accessToken, refreshToken };
}

/**
 * Creates a configured Spotify Web API instance for server-side use
 */
export async function getSpotifyServerApi(): Promise<SpotifyWebApi> {
  await enforceRateLimit();
  
  const { accessToken, refreshToken } = await getTokensFromCookies();

  const spotifyApi = new SpotifyWebApi({
    accessToken,
    refreshToken,
    clientId: SPOTIFY_CONFIG.clientId || '',
    clientSecret: SPOTIFY_CONFIG.clientSecret || '',
    redirectUri: SPOTIFY_CONFIG.redirectUri || '',
  });

  return spotifyApi;
}

/**
 * Executes a Spotify API call with retry logic and error handling
 */
export async function executeSpotifyApiCall<T>(
  apiCall: (api: SpotifyWebApi) => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  return withRetry(
    async () => {
      const api = await getSpotifyServerApi();
      return apiCall(api);
    },
    3,
    1000,
    context
  );
}
