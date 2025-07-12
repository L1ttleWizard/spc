/**
 * Spotify API configuration and utilities
 */

import SpotifyWebApi from 'spotify-web-api-node';
import { API_URLS, SPOTIFY_SCOPES, ERROR_MESSAGES } from '@/constants';
import { SpotifyError, ErrorType } from '@/lib/error-handler';

// Environment validation
function validateEnvironment(): {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
} {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://127.0.0.1:3000'}/api/auth/callback/spotify`;

  if (!clientId || !clientSecret) {
    throw new SpotifyError(
      ErrorType.VALIDATION,
      ERROR_MESSAGES.INVALID_CREDENTIALS,
      new Error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET'),
      { clientId: !!clientId, clientSecret: !!clientSecret }
    );
  }

  return { clientId, clientSecret, redirectUri };
}

// Get validated environment variables
const { clientId, clientSecret, redirectUri } = validateEnvironment();

// Build authorization URL
const authParams = {
  response_type: 'code',
  client_id: clientId,
  scope: SPOTIFY_SCOPES.join(' '),
  redirect_uri: redirectUri,
};

const queryString = new URLSearchParams(authParams).toString();
export const LOGIN_URL = `${API_URLS.SPOTIFY_AUTH}?${queryString}`;

// Create Spotify API instance
const spotifyApi = new SpotifyWebApi({
  clientId,
  clientSecret,
  redirectUri,
});

export default spotifyApi;

// Export environment values for use in other modules
export const SPOTIFY_CONFIG = {
  clientId,
  clientSecret,
  redirectUri,
} as const;
