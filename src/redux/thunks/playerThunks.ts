// src/redux/thunks/playerThunks.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { setDevice, setActive, updatePlayerState } from '../slices/playerSlice';
import { TIMEOUT_CONFIG, RATE_LIMIT, ERROR_MESSAGES } from '@/constants';

// API base URL
const API_BASE = 'https://api.spotify.com/v1/me/player';

// Rate limiting state
let lastRequestTime = 0;

// Wait for rate limit
const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT.MIN_REQUEST_INTERVAL) {
    const delay = RATE_LIMIT.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastRequestTime = Date.now();
};

// Enhanced fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number): Promise<Response> => {
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
};

// Retry utility for network errors
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = RATE_LIMIT.MAX_RETRIES,
  baseDelay: number = RATE_LIMIT.BASE_DELAY
): Promise<T> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await waitForRateLimit();
      return await fn();
    } catch (error: unknown) {
      const typedError = error as { status?: number; message?: string };
      
      // Don't retry on certain errors
      if (typedError.status === 401 || 
          typedError.message?.includes('authentication') ||
          typedError.message?.includes('unauthorized')) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Handle rate limiting
      if (typedError.status === 429) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Handle timeouts and network errors
      if (typedError.message?.includes('timeout') || 
          typedError.message?.includes('ETIMEDOUT') ||
          typedError.message?.includes('network')) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), RATE_LIMIT.MAX_DELAY);
        console.warn(`Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries}):`, typedError.message);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
};

// Thunk configuration type
type ThunkApiConfig = {
  state: RootState;
  rejectValue: string;
};

// Fetch available devices
export const fetchDevices = createAsyncThunk<SpotifyApi.UserDevicesResponse, string, ThunkApiConfig>(
  'player/fetchDevices',
  async (accessToken, { rejectWithValue }) => {
    try {
      const response = await retryWithBackoff(async () => {
        const res = await fetchWithTimeout(
          'https://api.spotify.com/v1/me/player/devices',
          {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          },
          TIMEOUT_CONFIG.REQUEST_TIMEOUT
        );
        
        if (res.status === 429) {
          const error = new Error('Rate limited') as Error & { status: number };
          error.status = 429;
          throw error;
        }
        
        return res;
      });
      
      if (!response.ok) {
        return rejectWithValue('Failed to fetch devices');
      }
      
      const data = await response.json();
      return data;
    } catch (error: unknown) {
      const typedError = error as { status?: number; message?: string };
      if (typedError.status === 429) {
        return rejectWithValue('Rate limited - please try again later');
      }
      return rejectWithValue(`Failed to fetch devices: ${typedError.message || 'Unknown error'}`);
    }
  }
);

// Transfer playback to device
export const transferPlayback = createAsyncThunk<void, { deviceId: string; accessToken: string }, ThunkApiConfig>(
  'player/transferPlayback',
  async ({ deviceId, accessToken }, { rejectWithValue }) => {
    try {
      await retryWithBackoff(async () => {
        const res = await fetchWithTimeout(
          `${API_BASE}`,
          {
            method: 'PUT',
            headers: { 
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ device_ids: [deviceId], play: false }),
          },
          TIMEOUT_CONFIG.REQUEST_TIMEOUT
        );
        
        if (res.status === 429) {
          const error = new Error('Rate limited') as Error & { status: number };
          error.status = 429;
          throw error;
        }
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
      });
    } catch (error: unknown) {
      const typedError = error as { status?: number; message?: string };
      if (typedError.status === 429) {
        return rejectWithValue('Rate limited - please try again later');
      }
      return rejectWithValue(`Failed to transfer playback: ${typedError.message || 'Unknown error'}`);
    }
  }
);

// Get current playback state
export const getMyCurrentPlaybackState = createAsyncThunk<SpotifyApi.CurrentPlaybackResponse | null, string, ThunkApiConfig>(
    'player/getMyCurrentPlaybackState',
    async (accessToken, { rejectWithValue }) => {
      try {
        const response = await retryWithBackoff(async () => {
          const res = await fetchWithTimeout(
            `${API_BASE}`,
            {
              headers: { 'Authorization': `Bearer ${accessToken}` },
            },
            TIMEOUT_CONFIG.REQUEST_TIMEOUT
          );
          
          if (res.status === 429) {
            const error = new Error('Rate limited') as Error & { status: number };
            error.status = 429;
            throw error;
          }
          
          return res;
        });
        
        // Если ничего не играет, Spotify вернет 204 No Content
        if (response.status === 204) {
          return null;
        }
        if (!response.ok) {
          return rejectWithValue('Failed to get playback state');
        }
        const data = await response.json();
        return data;
      } catch (error: unknown) {
        const typedError = error as { status?: number; message?: string };
        if (typedError.status === 429) {
          return rejectWithValue('Rate limited - please try again later');
        }
        return rejectWithValue(`Failed to get playback state: ${typedError.message || 'Unknown error'}`);
      }
    }
  );

// Play track
export const playTrack = createAsyncThunk<void, { trackUri: string; accessToken: string; deviceId?: string }, ThunkApiConfig>(
  'player/playTrack',
  async ({ trackUri, accessToken, deviceId }, { rejectWithValue }) => {
    try {
      await retryWithBackoff(async () => {
        const url = deviceId ? `${API_BASE}/play?device_id=${deviceId}` : `${API_BASE}/play`;
        const res = await fetchWithTimeout(
          url,
          {
            method: 'PUT',
            headers: { 
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uris: [trackUri] }),
          },
          TIMEOUT_CONFIG.REQUEST_TIMEOUT
        );
        
        if (res.status === 429) {
          const error = new Error('Rate limited') as Error & { status: number };
          error.status = 429;
          throw error;
        }
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
      });
    } catch (error: unknown) {
      const typedError = error as { status?: number; message?: string };
      if (typedError.status === 429) {
        return rejectWithValue('Rate limited - please try again later');
      }
      return rejectWithValue(`Failed to play track: ${typedError.message || 'Unknown error'}`);
    }
  }
);

// Play playlist
export const playPlaylist = createAsyncThunk<void, { playlistUri: string; accessToken: string; deviceId?: string }, ThunkApiConfig>(
  'player/playPlaylist',
  async ({ playlistUri, accessToken, deviceId }, { rejectWithValue }) => {
    try {
      await retryWithBackoff(async () => {
        const url = deviceId ? `${API_BASE}/play?device_id=${deviceId}` : `${API_BASE}/play`;
        const res = await fetchWithTimeout(
          url,
          {
            method: 'PUT',
            headers: { 
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ context_uri: playlistUri }),
          },
          TIMEOUT_CONFIG.REQUEST_TIMEOUT
        );
        
        if (res.status === 429) {
          const error = new Error('Rate limited') as Error & { status: number };
          error.status = 429;
          throw error;
        }
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
      });
    } catch (error: unknown) {
      const typedError = error as { status?: number; message?: string };
      if (typedError.status === 429) {
        return rejectWithValue('Rate limited - please try again later');
      }
      return rejectWithValue(`Failed to play playlist: ${typedError.message || 'Unknown error'}`);
    }
  }
);

// Toggle play/pause
export const togglePlay = createAsyncThunk<void, { accessToken: string; deviceId?: string }, ThunkApiConfig>(
  'player/togglePlay',
  async ({ accessToken, deviceId }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const isPlaying = state.player.isPlaying;
      
      await retryWithBackoff(async () => {
        const url = deviceId ? `${API_BASE}/${isPlaying ? 'pause' : 'play'}?device_id=${deviceId}` : `${API_BASE}/${isPlaying ? 'pause' : 'play'}`;
        const res = await fetchWithTimeout(
          url,
          {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          },
          TIMEOUT_CONFIG.REQUEST_TIMEOUT
        );
        
        if (res.status === 429) {
          const error = new Error('Rate limited') as Error & { status: number };
          error.status = 429;
          throw error;
        }
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
      });
    } catch (error: unknown) {
      const typedError = error as { status?: number; message?: string };
      if (typedError.status === 429) {
        return rejectWithValue('Rate limited - please try again later');
      }
      return rejectWithValue(`Failed to toggle play: ${typedError.message || 'Unknown error'}`);
    }
  }
);

// Skip to next track
export const nextTrack = createAsyncThunk<void, { accessToken: string; deviceId?: string }, ThunkApiConfig>(
  'player/nextTrack',
  async ({ accessToken, deviceId }, { rejectWithValue }) => {
    try {
      await retryWithBackoff(async () => {
        const url = deviceId ? `${API_BASE}/next?device_id=${deviceId}` : `${API_BASE}/next`;
        const res = await fetchWithTimeout(
          url,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          },
          TIMEOUT_CONFIG.REQUEST_TIMEOUT
        );
        
        if (res.status === 429) {
          const error = new Error('Rate limited') as Error & { status: number };
          error.status = 429;
          throw error;
        }
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
      });
    } catch (error: unknown) {
      const typedError = error as { status?: number; message?: string };
      if (typedError.status === 429) {
        return rejectWithValue('Rate limited - please try again later');
      }
      return rejectWithValue(`Failed to skip to next track: ${typedError.message || 'Unknown error'}`);
    }
  }
);

// Skip to previous track
export const previousTrack = createAsyncThunk<void, { accessToken: string; deviceId?: string }, ThunkApiConfig>(
  'player/previousTrack',
  async ({ accessToken, deviceId }, { rejectWithValue }) => {
    try {
      await retryWithBackoff(async () => {
        const url = deviceId ? `${API_BASE}/previous?device_id=${deviceId}` : `${API_BASE}/previous`;
        const res = await fetchWithTimeout(
          url,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          },
          TIMEOUT_CONFIG.REQUEST_TIMEOUT
        );
        
        if (res.status === 429) {
          const error = new Error('Rate limited') as Error & { status: number };
          error.status = 429;
          throw error;
        }
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
      });
    } catch (error: unknown) {
      const typedError = error as { status?: number; message?: string };
      if (typedError.status === 429) {
        return rejectWithValue('Rate limited - please try again later');
      }
      return rejectWithValue(`Failed to skip to previous track: ${typedError.message || 'Unknown error'}`);
    }
  }
);

// Set volume
export const setVolume = createAsyncThunk<void, { volume: number; accessToken: string; deviceId?: string }, ThunkApiConfig>(
  'player/setVolume',
  async ({ volume, accessToken, deviceId }, { rejectWithValue }) => {
    try {
      await retryWithBackoff(async () => {
        const url = deviceId ? `${API_BASE}/volume?volume_percent=${volume}&device_id=${deviceId}` : `${API_BASE}/volume?volume_percent=${volume}`;
        const res = await fetchWithTimeout(
          url,
          {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          },
          TIMEOUT_CONFIG.REQUEST_TIMEOUT
        );
        
        if (res.status === 429) {
          const error = new Error('Rate limited') as Error & { status: number };
          error.status = 429;
          throw error;
        }
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
      });
    } catch (error: unknown) {
      const typedError = error as { status?: number; message?: string };
      if (typedError.status === 429) {
        return rejectWithValue('Rate limited - please try again later');
      }
      return rejectWithValue(`Failed to set volume: ${typedError.message || 'Unknown error'}`);
    }
  }
);

// Seek to position
export const seekToPosition = createAsyncThunk<void, { positionMs: number; accessToken: string; deviceId?: string }, ThunkApiConfig>(
  'player/seekToPosition',
  async ({ positionMs, accessToken, deviceId }, { rejectWithValue }) => {
    try {
      await retryWithBackoff(async () => {
        const url = deviceId ? `${API_BASE}/seek?position_ms=${positionMs}&device_id=${deviceId}` : `${API_BASE}/seek?position_ms=${positionMs}`;
        const res = await fetchWithTimeout(
          url,
          {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          },
          TIMEOUT_CONFIG.REQUEST_TIMEOUT
        );
        
        if (res.status === 429) {
          const error = new Error('Rate limited') as Error & { status: number };
          error.status = 429;
          throw error;
        }
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
      });
    } catch (error: unknown) {
      const typedError = error as { status?: number; message?: string };
      if (typedError.status === 429) {
        return rejectWithValue('Rate limited - please try again later');
      }
      return rejectWithValue(`Failed to seek to position: ${typedError.message || 'Unknown error'}`);
    }
  }
);

// Set repeat mode
export const setRepeatMode = createAsyncThunk<void, { state: 'track' | 'context' | 'off'; accessToken: string; deviceId?: string }, ThunkApiConfig>(
  'player/setRepeatMode',
  async ({ state, accessToken, deviceId }, { rejectWithValue }) => {
    try {
      await retryWithBackoff(async () => {
        const url = deviceId ? `${API_BASE}/repeat?state=${state}&device_id=${deviceId}` : `${API_BASE}/repeat?state=${state}`;
        const res = await fetchWithTimeout(
          url,
          {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          },
          TIMEOUT_CONFIG.REQUEST_TIMEOUT
        );
        
        if (res.status === 429) {
          const error = new Error('Rate limited') as Error & { status: number };
          error.status = 429;
          throw error;
        }
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
      });
    } catch (error: unknown) {
      const typedError = error as { status?: number; message?: string };
      if (typedError.status === 429) {
        return rejectWithValue('Rate limited - please try again later');
      }
      return rejectWithValue(`Failed to set repeat mode: ${typedError.message || 'Unknown error'}`);
    }
  }
);

// Toggle shuffle
export const toggleShuffle = createAsyncThunk<void, { state: boolean; accessToken: string; deviceId?: string }, ThunkApiConfig>(
  'player/toggleShuffle',
  async ({ state, accessToken, deviceId }, { rejectWithValue }) => {
    try {
      await retryWithBackoff(async () => {
        const url = deviceId ? `${API_BASE}/shuffle?state=${state}&device_id=${deviceId}` : `${API_BASE}/shuffle?state=${state}`;
        const res = await fetchWithTimeout(
          url,
          {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          },
          TIMEOUT_CONFIG.REQUEST_TIMEOUT
        );
        
        if (res.status === 429) {
          const error = new Error('Rate limited') as Error & { status: number };
          error.status = 429;
          throw error;
        }
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
      });
    } catch (error: unknown) {
      const typedError = error as { status?: number; message?: string };
      if (typedError.status === 429) {
        return rejectWithValue('Rate limited - please try again later');
      }
      return rejectWithValue(`Failed to toggle shuffle: ${typedError.message || 'Unknown error'}`);
    }
  }
);

// Get queue
export const getQueue = createAsyncThunk<SpotifyApi.QueueObject, { accessToken: string; deviceId?: string }, ThunkApiConfig>(
  'player/getQueue',
  async ({ accessToken, deviceId }, { rejectWithValue }) => {
    try {
      const response = await retryWithBackoff(async () => {
        const res = await fetchWithTimeout(
          `${API_BASE}/queue`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          },
          TIMEOUT_CONFIG.REQUEST_TIMEOUT
        );
        
        if (res.status === 429) {
          const error = new Error('Rate limited') as Error & { status: number };
          error.status = 429;
          throw error;
        }
        
        return res;
      });
      
      if (!response.ok) {
        return rejectWithValue('Failed to get queue');
      }
      
      const data = await response.json();
      return data;
    } catch (error: unknown) {
      const typedError = error as { status?: number; message?: string };
      if (typedError.status === 429) {
        return rejectWithValue('Rate limited - please try again later');
      }
      return rejectWithValue(`Failed to get queue: ${typedError.message || 'Unknown error'}`);
    }
  }
);

// Legacy function names for backward compatibility
export const togglePlayPause = togglePlay;
export const skipToNext = nextTrack;
export const skipToPrevious = previousTrack;
export const changeVolume = setVolume;
export const fetchQueue = getQueue;
export const setShuffleMode = toggleShuffle;

// Like/unlike track functions
export const likeTrack = createAsyncThunk<void, { accessToken: string; trackId: string }, ThunkApiConfig>(
  'player/likeTrack',
  async ({ accessToken, trackId }, { rejectWithValue }) => {
    try {
      if (!trackId || trackId === 'undefined') {
        console.warn('Cannot like track: invalid trackId', { trackId });
        return rejectWithValue('Invalid track ID');
      }

      await retryWithBackoff(async () => {
        const res = await fetchWithTimeout(
          `https://api.spotify.com/v1/me/tracks?ids=${trackId}`,
          {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          },
          TIMEOUT_CONFIG.REQUEST_TIMEOUT
        );
        
        if (res.status === 429) {
          const error = new Error('Rate limited') as Error & { status: number };
          error.status = 429;
          throw error;
        }
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
      });
    } catch (error: unknown) {
      const typedError = error as { status?: number; message?: string };
      if (typedError.status === 429) {
        return rejectWithValue('Rate limited - please try again later');
      }
      return rejectWithValue(`Failed to like track: ${typedError.message || 'Unknown error'}`);
    }
  }
);

export const unlikeTrack = createAsyncThunk<void, { accessToken: string; trackId: string }, ThunkApiConfig>(
  'player/unlikeTrack',
  async ({ accessToken, trackId }, { rejectWithValue }) => {
    try {
      if (!trackId || trackId === 'undefined') {
        console.warn('Cannot unlike track: invalid trackId', { trackId });
        return rejectWithValue('Invalid track ID');
      }

      await retryWithBackoff(async () => {
        const res = await fetchWithTimeout(
          `https://api.spotify.com/v1/me/tracks?ids=${trackId}`,
          {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          },
          TIMEOUT_CONFIG.REQUEST_TIMEOUT
        );
        
        if (res.status === 429) {
          const error = new Error('Rate limited') as Error & { status: number };
          error.status = 429;
          throw error;
        }
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
      });
    } catch (error: unknown) {
      const typedError = error as { status?: number; message?: string };
      if (typedError.status === 429) {
        return rejectWithValue('Rate limited - please try again later');
      }
      return rejectWithValue(`Failed to unlike track: ${typedError.message || 'Unknown error'}`);
    }
  }
);

// Fetch liked tracks
export const fetchLikedTracks = createAsyncThunk<string[], string, ThunkApiConfig>(
  'player/fetchLikedTracks',
  async (accessToken, { rejectWithValue }) => {
    try {
      const response = await retryWithBackoff(async () => {
        const res = await fetchWithTimeout(
          'https://api.spotify.com/v1/me/tracks?limit=50',
          {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          },
          TIMEOUT_CONFIG.REQUEST_TIMEOUT
        );
        
        if (res.status === 429) {
          const error = new Error('Rate limited') as Error & { status: number };
          error.status = 429;
          throw error;
        }
        
        return res;
      });
      
      if (!response.ok) {
        return rejectWithValue('Failed to fetch liked tracks');
      }
      
      const data = await response.json();
      return data.items.map((item: { track: { id: string } }) => item.track.id);
    } catch (error: unknown) {
      const typedError = error as { status?: number; message?: string };
      if (typedError.status === 429) {
        return rejectWithValue('Rate limited - please try again later');
      }
      return rejectWithValue(`Failed to fetch liked tracks: ${typedError.message || 'Unknown error'}`);
    }
  }
);

// Start playback (legacy function)
export const startPlayback = createAsyncThunk<void, { accessToken: string; contextUri?: string; trackUris?: string[] }, ThunkApiConfig>(
  'player/startPlayback',
  async ({ accessToken, contextUri, trackUris }, { getState, rejectWithValue }) => {
    try {
      const { player } = getState();
      const { selectedDeviceId } = player;

      if (!selectedDeviceId) return rejectWithValue('No device ID');

      const body: { context_uri?: string; uris?: string[] } = {};
      if (contextUri) body.context_uri = contextUri;
      if (trackUris) body.uris = trackUris;

      await retryWithBackoff(async () => {
        const res = await fetchWithTimeout(
          `${API_BASE}/play?device_id=${selectedDeviceId}`,
          {
            method: 'PUT',
            headers: { 
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
          },
          TIMEOUT_CONFIG.REQUEST_TIMEOUT
        );
        
        if (res.status === 429) {
          const error = new Error('Rate limited') as Error & { status: number };
          error.status = 429;
          throw error;
        }
        
        if (res.status !== 204) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
      });
    } catch (error: unknown) {
      const typedError = error as { status?: number; message?: string };
      if (typedError.status === 429) {
        return rejectWithValue('Rate limited - please try again later');
      }
      return rejectWithValue(`Failed to start playback: ${typedError.message || 'Unknown error'}`);
    }
  }
);