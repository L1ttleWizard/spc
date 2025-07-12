/**
 * Server-side Spotify API utilities with rate limiting and error handling
 */

import { cookies } from 'next/headers';
import SpotifyWebApi from 'spotify-web-api-node';
import { RATE_LIMIT, ERROR_MESSAGES, TIMEOUT_CONFIG } from '@/constants';
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
 * Creates a fetch request with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(ERROR_MESSAGES.TIMEOUT_ERROR);
    }
    throw error;
  }
}

/**
 * Retrieves tokens from cookies with error handling
 */
async function getTokensFromCookies(): Promise<{ accessToken: string; refreshToken: string }> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('spotify_access_token')?.value;
    const refreshToken = cookieStore.get('spotify_refresh_token')?.value;

    if (!accessToken || !refreshToken) {
      throw new SpotifyError(
        ErrorType.AUTHENTICATION,
        ERROR_MESSAGES.NO_ACCESS_TOKEN,
        new Error('Missing tokens in cookies'),
        { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken }
      );
    }

    return { accessToken, refreshToken };
  } catch (error) {
    if (error instanceof SpotifyError) {
      throw error;
    }
    throw new SpotifyError(
      ErrorType.AUTHENTICATION,
      ERROR_MESSAGES.NO_ACCESS_TOKEN,
      error as Error,
      { context: 'getTokensFromCookies' }
    );
  }
}

/**
 * Creates a configured Spotify Web API instance for server-side use
 */
export async function getSpotifyServerApi(): Promise<SpotifyWebApi> {
  await enforceRateLimit();
  
  try {
    const { accessToken, refreshToken } = await getTokensFromCookies();

    console.log('🔑 Tokens retrieved:', { 
      hasAccessToken: !!accessToken, 
      hasRefreshToken: !!refreshToken,
      accessTokenLength: accessToken?.length || 0
    });

    const spotifyApi = new SpotifyWebApi({
      accessToken,
      refreshToken,
      clientId: SPOTIFY_CONFIG.clientId || '',
      clientSecret: SPOTIFY_CONFIG.clientSecret || '',
      redirectUri: SPOTIFY_CONFIG.redirectUri || '',
    });

    return spotifyApi;
  } catch (error) {
    console.error('❌ Error creating Spotify API instance:', error);
    throw error;
  }
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
    RATE_LIMIT.MAX_RETRIES,
    RATE_LIMIT.BASE_DELAY,
    context
  );
}

/**
 * Enhanced fetch wrapper with timeout and retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = RATE_LIMIT.MAX_RETRIES,
  timeout: number = TIMEOUT_CONFIG.REQUEST_TIMEOUT
): Promise<Response> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await enforceRateLimit();
      
      const response = await fetchWithTimeout(url, options, timeout);
      
      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : RATE_LIMIT.BASE_DELAY * Math.pow(2, attempt - 1);
        
        if (attempt < maxRetries) {
          console.warn(`Rate limited, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors
      if (error instanceof Error) {
        if (error.message.includes('authentication') || 
            error.message.includes('unauthorized') ||
            error.message.includes('401')) {
          break;
        }
      }
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff
      const delay = Math.min(
        RATE_LIMIT.BASE_DELAY * Math.pow(2, attempt - 1),
        RATE_LIMIT.MAX_DELAY
      );
      
      console.warn(`Request failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries}):`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new SpotifyError(
    ErrorType.NETWORK,
    lastError?.message || ERROR_MESSAGES.NETWORK_ERROR,
    lastError,
    { url, attempts: maxRetries }
  );
}
