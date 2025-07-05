// src/hooks/useSpotifyPlayer.ts

"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/hooks/useSession';
import { useDispatch } from 'react-redux';
import { setDevice, updatePlayerState, setActive } from '@/redux/slices/playerSlice';
import { getMyCurrentPlaybackState } from '@/redux/thunks/playerThunks';
import { AppDispatch } from '@/redux/store';

interface SpotifyPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  getCurrentState(): Promise<unknown>;
  setName(name: string): Promise<void>;
  getVolume(): Promise<number>;
  setVolume(volume: number): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  previousTrack(): Promise<void>;
  nextTrack(): Promise<void>;
  activateElement(): Promise<void>;
  togglePlay(): Promise<void>;
  seek(position_ms: number): Promise<void>;
}

export function useSpotifyPlayer() {
  const { accessToken } = useSession();
  const dispatch = useDispatch<AppDispatch>();
  const [player, setPlayer] = useState<SpotifyPlayer | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<unknown>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const initializePlayer = useCallback(() => {
    if (!accessToken) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;

    document.body.appendChild(script);

    (window as Window & { onSpotifyWebPlaybackSDKReady: () => void }).onSpotifyWebPlaybackSDKReady = () => {
      const player = new (window as Window & { Spotify: { Player: new (config: { name: string; getOAuthToken: (cb: (token: string) => void) => void; volume: number }) => SpotifyPlayer } }).Spotify.Player({
        name: 'Spotify Clone Player',
        getOAuthToken: (cb: (token: string) => void) => { cb(accessToken); },
        volume: 0.5
      });

      // Error handling
      player.addListener('initialization_error', ({ message }: { message: string }) => {
        console.error('Failed to initialize:', message);
      });

      player.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error('Failed to authenticate:', message);
      });

      player.addListener('account_error', ({ message }: { message: string }) => {
        console.error('Failed to validate Spotify account:', message);
      });

      player.addListener('playback_error', ({ message }: { message: string }) => {
        console.error('Failed to perform playback:', message);
      });

      // Playback status updates
      player.addListener('player_state_changed', (state: Spotify.PlaybackState | null) => {
        if (!state) {
          dispatch(setActive(false));
          return;
        }
        
        setCurrentTrack(state.track_window.current_track);
        setIsActive(true);
        dispatch(setActive(true));
        dispatch(updatePlayerState(state));
      });

      // Ready
      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        setPlayer(player);
        dispatch(setDevice({ device_id, volume: 0.5 }));
        
        // Получаем текущее состояние воспроизведения
        if (accessToken) {
          dispatch(getMyCurrentPlaybackState(accessToken));
        }
      });

      // Not Ready
      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
        setIsActive(false);
        dispatch(setActive(false));
      });

      // Connect to the player
      player.connect();
    };
  }, [accessToken, dispatch]);

  const playTrack = useCallback(async (trackUri: string) => {
    console.log('playTrack called:', { trackUri, deviceId, hasAccessToken: !!accessToken });
    
    if (!deviceId || !accessToken) {
      console.warn('Cannot play track: missing deviceId or accessToken');
      return;
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [trackUri] }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        console.log('Started playing track:', trackUri);
      } else {
        const errorText = await response.text();
        console.error('Failed to play track:', response.status, response.statusText, errorText);
      }
    } catch (error) {
      console.error('Error playing track:', error);
    }
  }, [deviceId, accessToken]);

  const playPlaylist = useCallback(async (playlistUri: string, trackIndex: number = 0) => {
    console.log('playPlaylist called:', { playlistUri, trackIndex, deviceId, hasAccessToken: !!accessToken });
    
    if (!deviceId || !accessToken) {
      console.warn('Cannot play playlist: missing deviceId or accessToken');
      return;
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          context_uri: playlistUri,
          offset: { position: trackIndex }
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        console.log('Started playing playlist:', playlistUri);
      } else {
        const errorText = await response.text();
        console.error('Failed to play playlist:', response.status, response.statusText, errorText);
      }
    } catch (error) {
      console.error('Error playing playlist:', error);
    }
  }, [deviceId, accessToken]);

  const togglePlay = useCallback(async () => {
    if (!player) return;
    await player.togglePlay();
  }, [player]);

  const pause = useCallback(async () => {
    if (!player) return;
    await player.pause();
  }, [player]);

  const resume = useCallback(async () => {
    if (!player) return;
    await player.resume();
  }, [player]);

  const nextTrack = useCallback(async () => {
    if (!player) return;
    await player.nextTrack();
  }, [player]);

  const previousTrack = useCallback(async () => {
    if (!player) return;
    await player.previousTrack();
  }, [player]);

  const setVolume = useCallback(async (volume: number) => {
    if (!player) return;
    await player.setVolume(volume);
  }, [player]);

  useEffect(() => {
    if (accessToken) {
      initializePlayer();
    }

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [accessToken, initializePlayer]);

  return {
    player,
    isActive,
    currentTrack,
    deviceId,
    playTrack,
    playPlaylist,
    togglePlay,
    pause,
    resume,
    nextTrack,
    previousTrack,
    setVolume,
  };
}