// src/redux/slices/playerSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { togglePlayPause, changeVolume, seekToPosition, startPlayback, getMyCurrentPlaybackState, skipToPrevious, skipToNext, fetchDevices, likeTrack, unlikeTrack, fetchLikedTracks, getQueue } from '../thunks/playerThunks';
import { SimpleTrack, LoadingStatus } from '@/types';

export type RepeatMode = 'off' | 'context' | 'track';

export interface PlayerState {
  isPlaying: boolean;
  currentTrack: SimpleTrack | null;
  positionMs: number;
  volume: number;
  isActive: boolean;
  status: LoadingStatus;
  devices: SpotifyApi.UserDevice[];
  selectedDeviceId: string | null;
  likedTracks: string[];
  repeatMode: RepeatMode;
  shuffle: boolean;
  queue: SpotifyApi.QueueObject | null;
  queueStatus: LoadingStatus;
}

const initialState: PlayerState = {
  isPlaying: false,
  currentTrack: null,
  positionMs: 0,
  volume: 0.5,
  isActive: false,
  status: 'idle',
  devices: [],
  selectedDeviceId: null,
  likedTracks: [],
  repeatMode: 'off',
  shuffle: false,
  queue: null,
  queueStatus: 'idle',
};

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setDevice: (state, action: PayloadAction<{ device_id: string; volume: number }>) => {
      state.selectedDeviceId = action.payload.device_id;
      state.volume = action.payload.volume;
    },
    updatePlayerState: (state, action: PayloadAction<Spotify.PlaybackState>) => {
      state.positionMs = action.payload.position;
      state.isPlaying = !action.payload.paused;
      
      // Only update repeat and shuffle state from Spotify if we're not currently updating them
      if (action.payload.repeat_state) {
        state.repeatMode = action.payload.repeat_state as RepeatMode;
      }
      if (typeof action.payload.shuffle_state === 'boolean') {
        state.shuffle = action.payload.shuffle_state;
      }
      
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
            images: currentTrack.album.images.map(img => ({
              url: img.url,
              height: img.height || 0,
              width: img.width || 0
            }))
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
    },
    addLikedTrack: (state, action: PayloadAction<string>) => {
      if (!state.likedTracks.includes(action.payload)) {
        state.likedTracks.push(action.payload);
      }
    },
    removeLikedTrack: (state, action: PayloadAction<string>) => {
      state.likedTracks = state.likedTracks.filter(id => id !== action.payload);
    },
    setLikedTracks: (state, action: PayloadAction<string[]>) => {
      state.likedTracks = action.payload;
    },
    setRepeatMode: (state, action: PayloadAction<RepeatMode>) => {
      state.repeatMode = action.payload;
    },
    toggleShuffle: (state) => {
      state.shuffle = !state.shuffle;
    },
    setShuffle: (state, action: PayloadAction<boolean>) => {
      state.shuffle = action.payload;
    },
    setQueue: (state, action: PayloadAction<SpotifyApi.QueueObject | null>) => {
      state.queue = action.payload;
    },
    clearQueue: (state) => {
      state.queue = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(togglePlayPause.fulfilled, (state) => {
        state.isPlaying = !state.isPlaying;
      })
      .addCase(startPlayback.fulfilled, (state) => {
        state.isPlaying = true;
      })
      .addCase(changeVolume.fulfilled, (state, action) => {
        // Convert percentage back to decimal for storage
        state.volume = action.payload / 100;
      })
      .addCase(seekToPosition.fulfilled, (state, action) => {
        state.positionMs = action.payload;
      })
      .addCase(getMyCurrentPlaybackState.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getMyCurrentPlaybackState.fulfilled, (state, action) => {
        if (action.payload) {
          const playbackData = action.payload;
          state.isActive = true;
          state.isPlaying = playbackData.is_playing || false;
          state.positionMs = playbackData.progress_ms || 0;
          
          // Only update repeat and shuffle state from Spotify API if we're not currently updating them
          if (playbackData.repeat_state) {
            state.repeatMode = playbackData.repeat_state as RepeatMode;
          }
          if (typeof playbackData.shuffle_state === 'boolean') {
            state.shuffle = playbackData.shuffle_state;
          }
          
          if (playbackData.item && 'artists' in playbackData.item) {
            const track = playbackData.item as SpotifyApi.TrackObjectFull;
            state.currentTrack = {
              id: track.id,
              uri: track.uri,
              name: track.name,
              duration_ms: track.duration_ms,
              artists: track.artists.map(artist => ({
                name: artist.name,
                uri: artist.uri
              })),
              album: {
                name: track.album.name,
                uri: track.album.uri,
                images: track.album.images.map(img => ({
                  url: img.url,
                  height: img.height || 0,
                  width: img.width || 0
                }))
              }
            };
          } else {
            state.currentTrack = null;
          }
        } else {
          // No playback data means nothing is playing
          state.isActive = false;
          state.isPlaying = false;
          state.currentTrack = null;
          state.positionMs = 0;
        }
        state.status = 'succeeded';
      })
      .addCase(skipToPrevious.fulfilled, (state) => {
        state.positionMs = 0;
      })
      .addCase(skipToNext.fulfilled, (state) => {
        state.positionMs = 0;
      })
      .addCase(fetchDevices.fulfilled, (state, action) => {
        state.devices = action.payload;
        // Only set selectedDeviceId if it's not already set or if the current device is no longer available
        if (!state.selectedDeviceId && action.payload.length > 0) {
          state.selectedDeviceId = action.payload[0]?.id || null;
        } else if (state.selectedDeviceId && !action.payload.find(device => device.id === state.selectedDeviceId)) {
          // If current selected device is no longer available, select the first available device
          state.selectedDeviceId = action.payload.length > 0 ? action.payload[0]?.id || null : null;
        }
      })
      .addCase(fetchLikedTracks.fulfilled, (state, action) => {
        state.likedTracks = action.payload;
      })
      .addCase(getQueue.pending, (state) => {
        state.queueStatus = 'loading';
      })
      .addCase(getQueue.fulfilled, (state, action) => {
        state.queue = action.payload;
        state.queueStatus = 'succeeded';
      })
      .addCase(getQueue.rejected, (state) => {
        state.queueStatus = 'failed';
      })
      .addCase(likeTrack.fulfilled, (state, action) => {
        // Add track to liked tracks if not already present
        const trackId = action.meta.arg.trackId;
        if (!state.likedTracks.includes(trackId)) {
          state.likedTracks.push(trackId);
        }
      })
      .addCase(unlikeTrack.fulfilled, (state, action) => {
        // Remove track from liked tracks
        const trackId = action.meta.arg.trackId;
        state.likedTracks = state.likedTracks.filter(id => id !== trackId);
      });
  }
});

export const { 
  setDevice, 
  updatePlayerState, 
  setVolumeState, 
  setActive, 
  addLikedTrack, 
  removeLikedTrack, 
  setLikedTracks, 
  setRepeatMode, 
  toggleShuffle, 
  setShuffle,
  setQueue,
  clearQueue
} = playerSlice.actions;

export const selectPlayerState = (state: RootState) => state.player;
export const selectDevices = (state: RootState) => state.player.devices;
export const selectSelectedDeviceId = (state: RootState) => state.player.selectedDeviceId;
export const selectQueue = (state: RootState) => state.player.queue;
export const selectQueueStatus = (state: RootState) => state.player.queueStatus;

export default playerSlice.reducer;