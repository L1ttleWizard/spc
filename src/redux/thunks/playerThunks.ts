// src/redux/thunks/playerThunks.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { setDevice } from '../slices/playerSlice';

const API_BASE = 'https://api.spotify.com/v1/me/player';

interface ThunkApiConfig {
  state: RootState;
  rejectValue: string;
}

// Rate limiting utility
const rateLimiter = {
  lastCall: 0,
  minInterval: 100, // Minimum 100ms between calls
};

const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastCall = now - rateLimiter.lastCall;
  
  if (timeSinceLastCall < rateLimiter.minInterval) {
    await new Promise(resolve => 
      setTimeout(resolve, rateLimiter.minInterval - timeSinceLastCall)
    );
  }
  
  rateLimiter.lastCall = Date.now();
};

// Retry utility for 429 errors
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await waitForRateLimit();
      return await fn();
    } catch (error: unknown) {
      const typedError = error as { status?: number };
      if (typedError.status === 429 && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
};

// Управление Play/Pause
export const togglePlayPause = createAsyncThunk<boolean, string, ThunkApiConfig>(
  'player/togglePlayPause',
  async (accessToken, { getState, rejectWithValue }) => {
    const { player } = getState();
    const { isPlaying, selectedDeviceId } = player;

    if (!selectedDeviceId) return rejectWithValue('No device ID');
    
    const endpoint = isPlaying ? '/pause' : '/play';
    const response = await fetch(`${API_BASE}${endpoint}?device_id=${selectedDeviceId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    
    if (response.status === 204) {
      return !isPlaying;
    }
    return rejectWithValue('Failed to toggle play/pause');
  }
);

// Запуск воспроизведения плейлиста/альбома/трека
export const startPlayback = createAsyncThunk<void, { accessToken: string; contextUri?: string; trackUris?: string[] }, ThunkApiConfig>(
  'player/startPlayback',
  async ({ accessToken, contextUri, trackUris }, { getState, rejectWithValue }) => {
    const { player } = getState();
    const { selectedDeviceId } = player;

    if (!selectedDeviceId) return rejectWithValue('No device ID');

    const body: { context_uri?: string; uris?: string[] } = {};
    if (contextUri) body.context_uri = contextUri;
    if (trackUris) body.uris = trackUris;

    const fetchOptions: RequestInit = {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    };
    if (Object.keys(body).length > 0) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}/play?device_id=${selectedDeviceId}`, fetchOptions);

    if (response.status !== 204) return rejectWithValue('Failed to start playback');
    return;
  }
);

// Изменение громкости
export const changeVolume = createAsyncThunk<number, { accessToken: string; volumePercent: number }, ThunkApiConfig>(
  'player/changeVolume',
  async ({ accessToken, volumePercent }, { getState, rejectWithValue }) => {
    const { player } = getState();
    if (!player.selectedDeviceId) return rejectWithValue('No device ID');

    await fetch(`${API_BASE}/volume?volume_percent=${volumePercent}&device_id=${player.selectedDeviceId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    return volumePercent;
  }
);

// Перемотка трека
export const seekToPosition = createAsyncThunk<number, { accessToken: string; positionMs: number }, ThunkApiConfig>(
  'player/seekToPosition',
  async ({ accessToken, positionMs }, { getState, rejectWithValue }) => {
    const { player } = getState();
    if (!player.selectedDeviceId) return rejectWithValue('No device ID');

    await fetch(`${API_BASE}/seek?position_ms=${positionMs}&device_id=${player.selectedDeviceId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    
    return positionMs;
  }
);

// Переключение на предыдущий трек
export const skipToPrevious = createAsyncThunk<void, string, ThunkApiConfig>(
  'player/skipToPrevious',
  async (accessToken, { dispatch, rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/previous`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      
      if (response.status === 204) {
        dispatch(getMyCurrentPlaybackState(accessToken));
        return;
      } else {
        return rejectWithValue('Failed to skip to previous track');
      }
    } catch (e) {
      const error = e as Error;
      return rejectWithValue(`Network error skipping to previous track: ${error.message}`);
    }
  }
);

// Переключение на следующий трек
export const skipToNext = createAsyncThunk<void, string, ThunkApiConfig>(
  'player/skipToNext',
  async (accessToken, { dispatch, rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/next`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      
      if (response.status === 204) {
        dispatch(getMyCurrentPlaybackState(accessToken));
        return;
      } else {
        return rejectWithValue('Failed to skip to next track');
      }
    } catch (e) {
      const error = e as Error;
      return rejectWithValue(`Network error skipping to next track: ${error.message}`);
    }
  }
);

export const getMyCurrentPlaybackState = createAsyncThunk<SpotifyApi.CurrentPlaybackResponse | null, string, ThunkApiConfig>(
    'player/getMyCurrentPlaybackState',
    async (accessToken, { rejectWithValue }) => {
      try {
        const response = await retryWithBackoff(async () => {
          const res = await fetch(`${API_BASE}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });
          
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

// Play a single track
export const playTrack = createAsyncThunk<void, { accessToken: string; deviceId: string; trackUri: string }, ThunkApiConfig>(
  'player/playTrack',
  async ({ accessToken, deviceId, trackUri }, { dispatch, rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [trackUri] }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (response.status === 204) {
        // Refresh player state
        dispatch(getMyCurrentPlaybackState(accessToken));
        return;
      } else {
        return rejectWithValue('Failed to play track');
      }
    } catch (e) {
      const error = e as Error;
      return rejectWithValue(`Network error playing track: ${error.message}`);
    }
  }
);

// Play a playlist (or album) from a given position
export const playPlaylist = createAsyncThunk<void, { accessToken: string; deviceId: string; playlistUri: string; trackIndex?: number }, ThunkApiConfig>(
  'player/playPlaylist',
  async ({ accessToken, deviceId, playlistUri, trackIndex = 0 }, { dispatch, rejectWithValue }) => {
    try {
      interface PlayRequestBody {
        context_uri: string;
        offset?: { position: number };
      }
      
      const body: PlayRequestBody = { context_uri: playlistUri };
      
      // If trackIndex is provided, add offset
      if (trackIndex > 0) {
        body.offset = { position: trackIndex };
      }

      const response = await fetch(`${API_BASE}/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (response.status === 204) {
        dispatch(getMyCurrentPlaybackState(accessToken));
        return;
      } else {
        return rejectWithValue('Failed to play playlist');
      }
    } catch (e) {
      const error = e as Error;
      return rejectWithValue(`Network error playing playlist: ${error.message}`);
    }
  }
);

// Fetch available devices
export const fetchDevices = createAsyncThunk<SpotifyApi.UserDevice[], string, ThunkApiConfig>(
  'player/fetchDevices',
  async (accessToken, { rejectWithValue }) => {
    const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      return rejectWithValue('Failed to fetch devices');
    }
    const data = await response.json();
    return data.devices;
  }
);

// Transfer playback to a different device
export const transferPlayback = createAsyncThunk<void, { accessToken: string; deviceId: string }, ThunkApiConfig>(
  'player/transferPlayback',
  async ({ accessToken, deviceId }, { dispatch, rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}`, {
        method: 'PUT',
        body: JSON.stringify({ device_ids: [deviceId], play: false }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (response.status === 204) {
        // Update the Redux state with the new selected device
        dispatch(setDevice({ device_id: deviceId, volume: 0.5 }));
        return;
      } else {
        return rejectWithValue('Failed to transfer playback');
      }
    } catch (e) {
      const error = e as Error;
      return rejectWithValue(`Network error transferring playback: ${error.message}`);
    }
  }
);

// Remove unused likeTrack, unlikeTrack thunks

// Fetch user's liked tracks
export const fetchLikedTracks = createAsyncThunk<string[], string, ThunkApiConfig>(
  'player/fetchLikedTracks',
  async (accessToken, { rejectWithValue }) => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      
      if (!response.ok) {
        return rejectWithValue('Failed to fetch liked tracks');
      }
      
      const data = await response.json();
      return data.items.map((item: { track: { id: string } }) => item.track.id);
    } catch (e) {
      const error = e as Error;
      return rejectWithValue(`Network error fetching liked tracks: ${error.message}`);
    }
  }
);

export const likeTrack = createAsyncThunk<void, { accessToken: string; trackId: string }, ThunkApiConfig>(
  'player/likeTrack',
  async ({ accessToken, trackId }, { rejectWithValue }) => {
    try {
      // Validate trackId
      if (!trackId || trackId === 'undefined') {
        console.warn('Cannot like track: invalid trackId', { trackId });
        return rejectWithValue('Invalid track ID');
      }

      const response = await fetch(`https://api.spotify.com/v1/me/tracks?ids=${trackId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        return rejectWithValue('Failed to like track');
      }
      return;
    } catch (e) {
      const error = e as Error;
      return rejectWithValue(`Network error liking track: ${error.message}`);
    }
  }
);

export const unlikeTrack = createAsyncThunk<void, { accessToken: string; trackId: string }, ThunkApiConfig>(
  'player/unlikeTrack',
  async ({ accessToken, trackId }, { rejectWithValue }) => {
    try {
      // Validate trackId
      if (!trackId || trackId === 'undefined') {
        console.warn('Cannot unlike track: invalid trackId', { trackId });
        return rejectWithValue('Invalid track ID');
      }

      const response = await fetch(`https://api.spotify.com/v1/me/tracks?ids=${trackId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        return rejectWithValue('Failed to unlike track');
      }
      return;
    } catch (e) {
      const error = e as Error;
      return rejectWithValue(`Network error unliking track: ${error.message}`);
    }
  }
);