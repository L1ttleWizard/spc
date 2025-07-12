/**
 * Application constants
 */

// API URLs
export const API_URLS = {
  SPOTIFY_AUTH: 'https://accounts.spotify.com/authorize',
  SPOTIFY_TOKEN: 'https://accounts.spotify.com/api/token',
  SPOTIFY_API: 'https://api.spotify.com/v1',
  SPOTIFY_PLAYER_SDK: 'https://sdk.scdn.co/spotify-player.js',
} as const;

// Cache settings
export const CACHE_CONFIG = {
  DURATION: 5 * 60 * 1000, // 5 minutes
  DEFAULT_LIMIT: 50,
  MAX_TRACKS: 200,
} as const;

// Rate limiting and timeout settings
export const RATE_LIMIT = {
  MIN_REQUEST_INTERVAL: 100, // 100ms between requests
  MAX_RETRIES: 3,
  BASE_DELAY: 1000,
  MAX_DELAY: 10000,
} as const;

// Network timeout settings
export const TIMEOUT_CONFIG = {
  REQUEST_TIMEOUT: 10000, // 10 seconds
  PLAYER_INIT_TIMEOUT: 15000, // 15 seconds
  SDK_LOAD_TIMEOUT: 10000, // 10 seconds
  CONNECTION_TIMEOUT: 8000, // 8 seconds
} as const;

// Spotify scopes
export const SPOTIFY_SCOPES = [
  'user-read-email',
  'user-read-private',
  'playlist-read-private',
  'playlist-read-collaborative',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-library-read',
  'user-library-modify',
  'user-read-recently-played',
] as const;

// Player settings
export const PLAYER_CONFIG = {
  NAME: 'Spotify Clone Player',
  DEFAULT_VOLUME: 0.5,
  REFRESH_INTERVAL: 2000, // 2 seconds
  SEEK_UPDATE_INTERVAL: 1000, // 1 second
  DEVICE_REFRESH_INTERVAL: 10000, // 10 seconds
} as const;

// UI Constants
export const UI_CONFIG = {
  SIDEBAR_WIDTH: 280,
  PLAYER_HEIGHT: 90,
  MOBILE_BREAKPOINT: 768,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NO_ACCESS_TOKEN: 'No access token found',
  SPOTIFY_AUTH_FAILED: 'Spotify authentication failed',
  TOKEN_EXCHANGE_FAILED: 'Token exchange failed',
  NETWORK_ERROR: 'Network error occurred',
  INVALID_CREDENTIALS: 'Invalid credentials provided',
  PLAYER_INIT_FAILED: 'Failed to initialize player',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  CONNECTION_ERROR: 'Connection failed. Please check your internet connection.',
  RATE_LIMIT_ERROR: 'Too many requests. Please wait a moment and try again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  TOKEN_OBTAINED: 'Tokens obtained successfully',
  PLAYER_READY: 'Player ready',
  TRACK_STARTED: 'Track started playing',
} as const;

// Default images
export const DEFAULT_IMAGES = {
  LIKED_SONGS: 'https://misc.scdn.co/liked-songs/liked-songs-300.png',
  PLACEHOLDER: '/images/placeholder-album.png',
} as const;

// Validation rules
export const VALIDATION = {
  MIN_VOLUME: 0,
  MAX_VOLUME: 1,
  MIN_POSITION: 0,
} as const;
