// src/redux/slices/playerSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { togglePlayPause, changeVolume, seekToPosition, startPlayback, getMyCurrentPlaybackState, skipToPrevious, skipToNext, playTrack, playPlaylist, likeTrack, unlikeTrack, fetchDevices, transferPlayback } from '../thunks/playerThunks';

export interface SimpleTrack {
    id: string;
    uri: string;
    name: string;
    duration_ms: number;
    artists: { name: string; uri: string }[];
    album: {
      name: string;
      uri: string;
      images: { url: string }[];
    };
  }
  
  interface PlayerState {
    deviceId: string | null;
    isActive: boolean;
    isPlaying: boolean;
    currentTrack: SimpleTrack | null;
    volume: number;
    position: number;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error?: string | null;
    prevIsPlaying?: boolean | undefined;
    likedTracks?: string[]; // Add likedTracks for optimistic UI
    devices?: SpotifyApi.UserDevice[];
    selectedDeviceId?: string | null;
  }
  
const initialState: PlayerState = {
  deviceId: null,
  isActive: false,
  isPlaying: false,
  currentTrack: null,
  volume: 1,
  position: 0,
  status: 'idle',
  error: null,
  prevIsPlaying: undefined,
  likedTracks: [],
  devices: [],
  selectedDeviceId: null,
};

export const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setDevice: (state, action: PayloadAction<{ device_id: string; volume: number }>) => {
      state.deviceId = action.payload.device_id;
      state.volume = action.payload.volume;
      state.isActive = true;
    },
    updatePlayerState: (state, action: PayloadAction<Spotify.PlaybackState>) => {
      state.position = action.payload.position;
      state.isPlaying = !action.payload.paused;
      const currentTrack = action.payload.track_window.current_track;
      if (currentTrack && currentTrack.id) {
        state.currentTrack = {
          id: currentTrack.id,
          uri: currentTrack.uri,
          name: currentTrack.name,
          duration_ms: currentTrack.duration_ms,
          artists: currentTrack.artists.map(artist => ({
            name: artist.name,
            uri: artist.uri
          })),
          album: {
            name: currentTrack.album.name,
            uri: currentTrack.album.uri,
            images: currentTrack.album.images
          }
        };
      } else {
        state.currentTrack = null;
      }
      state.isActive = true;
    },
    setVolumeState: (state, action: PayloadAction<number>) => {
      state.volume = action.payload;
    },
    setActive: (state, action: PayloadAction<boolean>) => {
        state.isActive = action.payload;
        if (!action.payload) {
            state.currentTrack = null;
            state.isPlaying = false;
        }
    }
  },
  extraReducers: (builder) => {
    builder
      // Toggle Play/Pause Optimistic
      .addCase(togglePlayPause.pending, (state) => {
        state.prevIsPlaying = state.isPlaying;
        state.isPlaying = !state.isPlaying;
        state.status = 'loading';
        state.error = null;
      })
      .addCase(togglePlayPause.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        state.isPlaying = action.payload;
        state.prevIsPlaying = undefined;
      })
      .addCase(togglePlayPause.rejected, (state) => {
        state.status = 'failed';
        state.isPlaying = state.prevIsPlaying ?? false;
        state.prevIsPlaying = undefined;
      })
      // Start Playback
      .addCase(startPlayback.fulfilled, (state) => {
        state.isPlaying = true;
      })
      // Change Volume
      .addCase(changeVolume.fulfilled, (state, action) => {
        state.volume = action.payload;
      })
      // Seek Position
      .addCase(seekToPosition.fulfilled, (state, action) => {
        state.position = action.payload;
      })
      .addCase(getMyCurrentPlaybackState.fulfilled, (state, action) => {
        if (action.payload) {
          const { is_playing, item, device, progress_ms } = action.payload;

          state.isPlaying = is_playing;
          state.volume = (device?.volume_percent ?? 100) / 100;
          state.position = progress_ms ?? 0;
          state.isActive = true;

          
          if (item && item.type === 'track') {
            // Преобразуем Spotify.Track в SimpleTrack
            const track = item as SpotifyApi.TrackObjectFull;
            if (track.id && track.uri && track.name) {
              state.currentTrack = {
                id: track.id,
                uri: track.uri,
                name: track.name,
                duration_ms: track.duration_ms,
                artists: track.artists.map((artist: SpotifyApi.ArtistObjectSimplified) => ({
                  name: artist.name,
                  uri: artist.uri
                })),
                album: {
                  name: track.album.name,
                  uri: track.album.uri,
                  images: track.album.images
                }
              };
            }
          } else {
            // Если играет подкаст или ничего не играет, сбрасываем трек
            state.currentTrack = null;
          }
        } else {
            // Если ответ пустой (204 No Content)
            state.isActive = false;
            state.isPlaying = false;
            state.currentTrack = null;
        }
      })
      // Skip to Previous
      .addCase(skipToPrevious.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(skipToPrevious.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(skipToPrevious.rejected, (state) => {
        state.status = 'failed';
      })
      // Skip to Next
      .addCase(skipToNext.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(skipToNext.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(skipToNext.rejected, (state) => {
        state.status = 'failed';
      })
      // Play Track Optimistic
      .addCase(playTrack.pending, (state) => {
        state.prevIsPlaying = state.isPlaying;
        state.isPlaying = true;
        state.status = 'loading';
        state.error = null;
      })
      .addCase(playTrack.fulfilled, (state) => {
        state.status = 'succeeded';
        state.error = null;
        state.prevIsPlaying = undefined;
      })
      .addCase(playTrack.rejected, (state, action) => {
        state.status = 'failed';
        state.isPlaying = state.prevIsPlaying ?? false;
        state.prevIsPlaying = undefined;
        state.error = action.payload as string || 'Failed to play track';
      })
      // Play Playlist Optimistic
      .addCase(playPlaylist.pending, (state) => {
        state.prevIsPlaying = state.isPlaying;
        state.isPlaying = true;
        state.status = 'loading';
        state.error = null;
      })
      .addCase(playPlaylist.fulfilled, (state) => {
        state.status = 'succeeded';
        state.error = null;
        state.prevIsPlaying = undefined;
      })
      .addCase(playPlaylist.rejected, (state, action) => {
        state.status = 'failed';
        state.isPlaying = state.prevIsPlaying ?? false;
        state.prevIsPlaying = undefined;
        state.error = action.payload as string || 'Failed to play playlist';
      })
      // Like Track
      .addCase(likeTrack.pending, (state, action) => {
        // Optimistically add to likedTracks
        if (action.meta.arg.trackId && !state.likedTracks?.includes(action.meta.arg.trackId)) {
          state.likedTracks?.push(action.meta.arg.trackId);
        }
      })
      .addCase(likeTrack.fulfilled, (state, action) => {
        // Ensure it's in likedTracks
        if (action.payload && !state.likedTracks?.includes(action.payload)) {
          state.likedTracks?.push(action.payload);
        }
      })
      .addCase(likeTrack.rejected, (state, action) => {
        // Rollback optimistic update if needed
        if (action.meta.arg.trackId && state.likedTracks) {
          state.likedTracks = state.likedTracks.filter(id => id !== action.meta.arg.trackId);
        }
        state.error = action.payload as string || 'Failed to like track';
      })
      // Unlike Track
      .addCase(unlikeTrack.pending, (state, action) => {
        // Optimistically remove from likedTracks
        if (action.meta.arg.trackId && state.likedTracks) {
          state.likedTracks = state.likedTracks.filter(id => id !== action.meta.arg.trackId);
        }
      })
      .addCase(unlikeTrack.fulfilled, (state, action) => {
        // Ensure it's removed from likedTracks
        if (action.payload && state.likedTracks) {
          state.likedTracks = state.likedTracks.filter(id => id !== action.payload);
        }
      })
      .addCase(unlikeTrack.rejected, (state, action) => {
        // Rollback optimistic update if needed
        if (action.meta.arg.trackId && !state.likedTracks?.includes(action.meta.arg.trackId)) {
          state.likedTracks?.push(action.meta.arg.trackId);
        }
        state.error = action.payload as string || 'Failed to unlike track';
      })
      // Fetch Devices
      .addCase(fetchDevices.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDevices.fulfilled, (state, action) => {
        state.devices = action.payload;
        state.status = 'succeeded';
      })
      .addCase(fetchDevices.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string || 'Failed to fetch devices';
      })
      // Transfer Playback
      .addCase(transferPlayback.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(transferPlayback.fulfilled, (state, action) => {
        state.selectedDeviceId = action.payload;
        state.deviceId = action.payload;
        state.status = 'succeeded';
      })
      .addCase(transferPlayback.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string || 'Failed to transfer playback';
      });
  },
});

export const { setDevice, updatePlayerState, setVolumeState, setActive } = playerSlice.actions;

export const selectPlayerState = (state: RootState) => state.player;
export const selectDevices = (state: RootState) => state.player.devices;
export const selectSelectedDeviceId = (state: RootState) => state.player.selectedDeviceId;

export default playerSlice.reducer;