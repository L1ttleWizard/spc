// src/redux/thunks/playerThunks.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../store';

const API_BASE = 'https://api.spotify.com/v1/me/player';

interface ThunkApiConfig {
  state: RootState;
  rejectValue: string;
}

// Управление Play/Pause
export const togglePlayPause = createAsyncThunk<boolean, string, ThunkApiConfig>(
  'player/togglePlayPause',
  async (accessToken, { getState, rejectWithValue }) => {
    const { player } = getState();
    const { isPlaying, deviceId } = player;

    if (!deviceId) return rejectWithValue('No device ID');
    
    const endpoint = isPlaying ? '/pause' : '/play';
    const response = await fetch(`${API_BASE}${endpoint}?device_id=${deviceId}`, {
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
    const { deviceId } = player;

    if (!deviceId) return rejectWithValue('No device ID');

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

    const response = await fetch(`${API_BASE}/play?device_id=${deviceId}`, fetchOptions);

    if (response.status !== 204) return rejectWithValue('Failed to start playback');
    return;
  }
);

// Изменение громкости
export const changeVolume = createAsyncThunk<number, { accessToken: string; volumePercent: number }, ThunkApiConfig>(
  'player/changeVolume',
  async ({ accessToken, volumePercent }, { getState, rejectWithValue }) => {
    const { player } = getState();
    if (!player.deviceId) return rejectWithValue('No device ID');

    await fetch(`${API_BASE}/volume?volume_percent=${volumePercent}&device_id=${player.deviceId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    return volumePercent / 100;
  }
);

// Перемотка трека
export const seekToPosition = createAsyncThunk<number, { accessToken: string; positionMs: number }, ThunkApiConfig>(
  'player/seekToPosition',
  async ({ accessToken, positionMs }, { getState, rejectWithValue }) => {
    const { player } = getState();
    if (!player.deviceId) return rejectWithValue('No device ID');

    await fetch(`${API_BASE}/seek?position_ms=${positionMs}&device_id=${player.deviceId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    
    return positionMs;
  }
);

// Переключение на предыдущий трек
export const skipToPrevious = createAsyncThunk<void, string, ThunkApiConfig>(
  'player/skipToPrevious',
  async (accessToken, { getState, rejectWithValue }) => {
    const { player } = getState();
    if (!player.deviceId) {
      return rejectWithValue('No device ID');
    }

    const response = await fetch(`${API_BASE}/previous?device_id=${player.deviceId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (response.status !== 204) {
      return rejectWithValue('Failed to skip to previous track');
    }
    return;
  }
);

// Переключение на следующий трек
export const skipToNext = createAsyncThunk<void, string, ThunkApiConfig>(
  'player/skipToNext',
  async (accessToken, { getState, rejectWithValue }) => {
    const { player } = getState();
    if (!player.deviceId) {
      return rejectWithValue('No device ID');
    }

    const response = await fetch(`${API_BASE}/next?device_id=${player.deviceId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (response.status !== 204) {
      return rejectWithValue('Failed to skip to next track');
    }
    return;
  }
);

export const getMyCurrentPlaybackState = createAsyncThunk<SpotifyApi.CurrentPlaybackResponse | null, string, ThunkApiConfig>(
    'player/getMyCurrentPlaybackState',
    async (accessToken, { rejectWithValue }) => {
      const response = await fetch(`${API_BASE}`, { // Запрос на /me/player
        headers: { 'Authorization': `Bearer ${accessToken}` },
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
    }
  );

// Play a single track
export const playTrack = createAsyncThunk<void, { accessToken: string; deviceId: string; trackUri: string }, ThunkApiConfig>(
  'player/playTrack',
  async ({ accessToken, deviceId, trackUri }, { dispatch, rejectWithValue }) => {
    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
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
    } catch (error) {
      return rejectWithValue('Network error playing track');
    }
  }
);

// Play a playlist (or album) from a given position
export const playPlaylist = createAsyncThunk<void, { accessToken: string; deviceId: string; playlistUri: string; trackIndex?: number }, ThunkApiConfig>(
  'player/playPlaylist',
  async ({ accessToken, deviceId, playlistUri, trackIndex = 0 }, { dispatch, rejectWithValue }) => {
    try {
      const requestBody = {
        context_uri: playlistUri,
        offset: { position: trackIndex }
      };
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify(requestBody),
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
        return rejectWithValue('Failed to play playlist');
      }
    } catch (error) {
      return rejectWithValue('Network error playing playlist');
    }
  }
);