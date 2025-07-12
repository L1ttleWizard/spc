// src/hooks/useSpotifyPlayer.ts

"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from '@/hooks/useSession';
import { useDispatch, useSelector } from 'react-redux';
import { setDevice, updatePlayerState, setActive } from '@/redux/slices/playerSlice';
import { 
  getMyCurrentPlaybackState, 
  playTrack as playTrackThunk, 
  playPlaylist as playPlaylistThunk,
  togglePlayPause,
  skipToNext,
  skipToPrevious,
  changeVolume
} from '@/redux/thunks/playerThunks';
import { AppDispatch, RootState } from '@/redux/store';

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
  addListener(event: string, callback: (data: unknown) => void): void;
}

// Global callback for Spotify SDK
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: typeof Spotify & {
      Player: new (config: unknown) => SpotifyPlayer;
    };
  }
}

export function useSpotifyPlayer() {
  const { accessToken } = useSession();
  const dispatch = useDispatch<AppDispatch>();
  const currentDeviceId = useSelector((state: RootState) => state.player.selectedDeviceId);
  const [player, setPlayer] = useState<SpotifyPlayer | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<unknown>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playbackStateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playerInstanceRef = useRef<SpotifyPlayer | null>(null);
  const hasInitializedRef = useRef(false);

  const initializePlayer = useCallback(() => {
    console.log('🎵 Initializing Spotify player:', { 
      accessToken: !!accessToken, 
      isInitializing, 
      hasInitialized: hasInitializedRef.current,
      sdkLoaded 
    });
    
    if (!accessToken) {
      console.warn('❌ No access token available for player initialization');
      return;
    }
    
    if (isInitializing || hasInitializedRef.current) {
      console.log('⏳ Player already initializing or initialized');
      return;
    }
    
    setIsInitializing(true);
    
    // Clear any existing timeouts
    if (initializationTimeoutRef.current) {
      clearTimeout(initializationTimeoutRef.current);
    }

    // Check if script is already loaded
    const existingScript = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]');
    if (existingScript) {
      console.log('📦 Spotify Web Playback SDK already loaded');
      if (sdkLoaded) {
        initializeSpotifyPlayer();
      } else {
        // Wait for SDK to be ready
        setTimeout(() => {
          if (window.Spotify) {
            console.log('✅ Spotify SDK available after script load');
            setSdkLoaded(true);
            initializeSpotifyPlayer();
          } else {
            console.error('❌ Spotify SDK not available after script load');
            setIsInitializing(false);
          }
        }, 100);
      }
    } else {
      console.log('📦 Loading Spotify Web Playback SDK...');
      // Set up global callback before loading script
      window.onSpotifyWebPlaybackSDKReady = () => {
        console.log('✅ Spotify Web Playback SDK ready');
        setSdkLoaded(true);
        initializeSpotifyPlayer();
      };

      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;

      script.onload = () => {
        console.log('📦 Spotify Web Playback SDK script loaded');
        // The callback will be called by the SDK when ready
      };

      script.onerror = () => {
        console.error('❌ Failed to load Spotify Web Playback SDK');
        setIsInitializing(false);
        setSdkLoaded(false);
      };

      document.body.appendChild(script);
    }

    function initializeSpotifyPlayer() {
      try {
        console.log('🎵 Creating Spotify player instance...');
        
        // Check if Spotify SDK is available
        if (!window.Spotify) {
          console.error('❌ Spotify SDK not available');
          setIsInitializing(false);
          return;
        }

        // Clean up existing player if any
        if (playerInstanceRef.current) {
          try {
            console.log('🧹 Cleaning up existing player instance');
            playerInstanceRef.current.disconnect();
          } catch (error) {
            console.warn('⚠️ Error disconnecting existing player:', error);
          }
          playerInstanceRef.current = null;
        }

        const player = new window.Spotify.Player({
          name: 'Spotify Clone Player',
          getOAuthToken: (cb: (token: string) => void) => { 
            console.log('🔑 Getting OAuth token for player');
            if (accessToken) {
              cb(accessToken); 
            } else {
              console.error('❌ No access token available for player');
            }
          },
          volume: 0.5
        });

        playerInstanceRef.current = player;

        // Error handling
        player.addListener('initialization_error', (({ message }: { message: string }) => {
          console.error('❌ Failed to initialize:', message);
          setIsInitializing(false);
        }) as (data: unknown) => void);

        player.addListener('authentication_error', (({ message }: { message: string }) => {
          console.error('❌ Failed to authenticate:', message);
          setIsInitializing(false);
        }) as (data: unknown) => void);

        player.addListener('account_error', (({ message }: { message: string }) => {
          console.error('❌ Failed to validate Spotify account:', message);
          setIsInitializing(false);
        }) as (data: unknown) => void);

        player.addListener('playback_error', (({ message }: { message: string }) => {
          console.error('❌ Failed to perform playback:', message);
        }) as (data: unknown) => void);

        // Playback status updates
        player.addListener('player_state_changed', ((state: unknown) => {
          console.log('🎵 Player state changed:', !!state);
          if (!state) {
            dispatch(setActive(false));
            return;
          }

          const typedState = state as Spotify.PlaybackState;
          setCurrentTrack(typedState.track_window.current_track);
          setIsActive(true);
          dispatch(setActive(true));
          dispatch(updatePlayerState(typedState));
        }) as (data: unknown) => void);

        // Ready
        player.addListener('ready', (({ device_id }: { device_id: string }) => {
          console.log('✅ Ready with Device ID', device_id);
          setDeviceId(device_id);
          setPlayer(player);
          setIsInitializing(false);
          hasInitializedRef.current = true;
          
          // Only dispatch setDevice if the deviceId has actually changed
          if (device_id !== currentDeviceId) {
            dispatch(setDevice({ device_id, volume: 0.5 }));
          }

          // Debounce the playback state fetch to avoid rate limiting
          if (playbackStateTimeoutRef.current) {
            clearTimeout(playbackStateTimeoutRef.current);
          }
          
          playbackStateTimeoutRef.current = setTimeout(() => {
            if (accessToken) {
              console.log('🎵 Fetching initial playback state...');
              dispatch(getMyCurrentPlaybackState(accessToken));
            }
          }, 1000); // Wait 1 second before fetching initial state
        }) as (data: unknown) => void);

        // Not Ready
        player.addListener('not_ready', (({ device_id }: { device_id: string }) => {
          console.log('⚠️ Device ID has gone offline', device_id);
          setIsActive(false);
          dispatch(setActive(false));
        }) as (data: unknown) => void);

        // Connect to the player
        console.log('🔌 Connecting to Spotify player...');
        player.connect().then((success) => {
          console.log('✅ Player connection result:', success);
        }).catch((error: unknown) => {
          console.error('❌ Failed to connect player:', error);
          setIsInitializing(false);
        });
        
        // Set a timeout for initialization
        initializationTimeoutRef.current = setTimeout(() => {
          if (isInitializing) {
            console.warn('⏰ Player initialization timed out');
            setIsInitializing(false);
          }
        }, 10000); // 10 second timeout
        
      } catch (error) {
        console.error('❌ Error creating Spotify player:', error);
        setIsInitializing(false);
      }
    }
  }, [accessToken, dispatch, isInitializing, sdkLoaded, currentDeviceId]);

  const playTrack = useCallback((trackUri: string) => {
    console.log('🎵 playTrack called:', { trackUri, deviceId: !!currentDeviceId, accessToken: !!accessToken });

    if (!currentDeviceId || !accessToken) {
      console.warn('❌ Cannot play track: missing deviceId or accessToken', { deviceId: !!currentDeviceId, accessToken: !!accessToken });
      return;
    }

    // Validate track URI format
    if (!trackUri || !trackUri.startsWith('spotify:track:')) {
      console.error('❌ Invalid track URI format:', trackUri);
      return;
    }

    console.log('🎵 Dispatching playTrack thunk');
    dispatch(playTrackThunk({ accessToken, deviceId: currentDeviceId, trackUri }));
  }, [currentDeviceId, accessToken, dispatch]);

  const playPlaylist = useCallback((playlistUri: string, trackIndex: number = 0) => {
    console.log('🎵 playPlaylist called:', { playlistUri, trackIndex, deviceId: !!currentDeviceId, accessToken: !!accessToken });

    if (!currentDeviceId || !accessToken) {
      console.warn('❌ Cannot play playlist: missing deviceId or accessToken', { deviceId: !!currentDeviceId, accessToken: !!accessToken });
      return;
    }

    // Validate playlist URI format
    if (!playlistUri || !playlistUri.startsWith('spotify:')) {
      console.error('❌ Invalid playlist URI format:', playlistUri);
      return;
    }

    console.log('🎵 Dispatching playPlaylist thunk');
    dispatch(playPlaylistThunk({ accessToken, deviceId: currentDeviceId, playlistUri, trackIndex }));
  }, [currentDeviceId, accessToken, dispatch]);

  const togglePlay = useCallback(async () => {
    console.log('🎵 togglePlay called');
    if (!accessToken) {
      console.warn('❌ No access token for togglePlay');
      return;
    }
    
    try {
      console.log('🎵 Dispatching togglePlayPause thunk');
      await dispatch(togglePlayPause(accessToken)).unwrap();
    } catch (error) {
      console.warn('⚠️ Error toggling play:', error);
    }
  }, [accessToken, dispatch]);

  const pause = useCallback(async () => {
    if (!accessToken) {
      console.warn('❌ No access token for pause');
      return;
    }
    
    try {
      await dispatch(togglePlayPause(accessToken)).unwrap();
    } catch (error) {
      console.warn('⚠️ Error pausing:', error);
    }
  }, [accessToken, dispatch]);

  const resume = useCallback(async () => {
    if (!accessToken) {
      console.warn('❌ No access token for resume');
      return;
    }
    
    try {
      await dispatch(togglePlayPause(accessToken)).unwrap();
    } catch (error) {
      console.warn('⚠️ Error resuming:', error);
    }
  }, [accessToken, dispatch]);

  const nextTrack = useCallback(async () => {
    console.log('🎵 nextTrack called');
    if (!accessToken) {
      console.warn('❌ No access token for nextTrack');
      return;
    }
    
    try {
      console.log('🎵 Dispatching skipToNext thunk');
      await dispatch(skipToNext(accessToken)).unwrap();
    } catch (error) {
      console.warn('⚠️ Error skipping to next track:', error);
    }
  }, [accessToken, dispatch]);

  const previousTrack = useCallback(async () => {
    console.log('🎵 previousTrack called');
    if (!accessToken) {
      console.warn('❌ No access token for previousTrack');
      return;
    }
    
    try {
      console.log('🎵 Dispatching skipToPrevious thunk');
      await dispatch(skipToPrevious(accessToken)).unwrap();
    } catch (error) {
      console.warn('⚠️ Error skipping to previous track:', error);
    }
  }, [accessToken, dispatch]);

  const setVolume = useCallback(async (volume: number) => {
    console.log('🎵 setVolume called:', volume);
    if (!accessToken) {
      console.warn('❌ No access token for setVolume');
      return;
    }
    
    try {
      console.log('🎵 Dispatching changeVolume thunk');
      await dispatch(changeVolume({ accessToken, volumePercent: Math.round(volume * 100) })).unwrap();
    } catch (error) {
      console.warn('⚠️ Error setting volume:', error);
    }
  }, [accessToken, dispatch]);

  useEffect(() => {
    console.log('🎵 useSpotifyPlayer useEffect:', { 
      accessToken: !!accessToken, 
      hasInitialized: hasInitializedRef.current 
    });
    
    if (accessToken && !hasInitializedRef.current) {
      initializePlayer();
    }

    // Set up periodic refresh of playback state
    let refreshInterval: NodeJS.Timeout | null = null;
    if (accessToken && currentDeviceId) {
      refreshInterval = setInterval(() => {
        console.log('🔄 Refreshing playback state...');
        dispatch(getMyCurrentPlaybackState(accessToken));
      }, 5000); // Refresh every 5 seconds
    }

    return () => {
      // Clean up refresh interval
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      
      // Clean up player instance
      if (playerInstanceRef.current && typeof playerInstanceRef.current.disconnect === 'function') {
        try {
          console.log('🧹 Cleaning up player instance on unmount');
          playerInstanceRef.current.disconnect();
        } catch (error) {
          console.warn('⚠️ Error disconnecting player:', error);
        }
        playerInstanceRef.current = null;
      }
      
      // Clean up timeouts
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
      }
      if (playbackStateTimeoutRef.current) {
        clearTimeout(playbackStateTimeoutRef.current);
      }
    };
  }, [accessToken, currentDeviceId, initializePlayer, dispatch]);

  return {
    player,
    isActive,
    currentTrack,
    deviceId: currentDeviceId,
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