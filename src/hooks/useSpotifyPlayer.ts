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
  changeVolume,
  fetchDevices,
  getQueue
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
    __spotifyScriptLoading?: boolean;
  }
}

export function useSpotifyPlayer() {
  const { accessToken } = useSession();
  const dispatch = useDispatch<AppDispatch>();
  const currentDeviceId = useSelector((state: RootState) => state.player.selectedDeviceId);
  const [player, setPlayer] = useState<SpotifyPlayer | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<unknown>(null);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [trackDuration, setTrackDuration] = useState(0);

  const [isInitializing, setIsInitializing] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playbackStateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playerInstanceRef = useRef<SpotifyPlayer | null>(null);
  const scriptElementRef = useRef<HTMLScriptElement | null>(null);
  const hasInitializedRef = useRef(false);

  // Fetch available devices
  const fetchAvailableDevices = useCallback(async () => {
    if (!accessToken) return;
    
    try {
      console.log('📱 Fetching available devices...');
      await dispatch(fetchDevices(accessToken)).unwrap();
    } catch (error) {
      console.warn('⚠️ Error fetching devices:', error);
    }
  }, [accessToken, dispatch]);

  // Update seek position from player state
  const updateSeekPosition = useCallback((state: Spotify.PlaybackState) => {
    if (state && state.track_window && state.track_window.current_track) {
      setCurrentPosition(state.position);
      setTrackDuration(state.track_window.current_track.duration_ms);
    }
  }, []);

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

    // Check if script is already loaded or loading
    if (window.__spotifyScriptLoading) {
      console.log('📦 Spotify Web Playback SDK already loading, waiting...');
      return;
    }
    
    const existingScript = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]');
    if (existingScript) {
      console.log('📦 Spotify Web Playback SDK already loaded');
      scriptElementRef.current = existingScript as HTMLScriptElement;
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
      window.__spotifyScriptLoading = true;
      
      // Set up global callback before loading script
      window.onSpotifyWebPlaybackSDKReady = () => {
        console.log('✅ Spotify Web Playback SDK ready');
        window.__spotifyScriptLoading = false;
        setSdkLoaded(true);
        initializeSpotifyPlayer();
      };

      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      scriptElementRef.current = script;

      script.onload = () => {
        console.log('📦 Spotify Web Playback SDK script loaded');
        // The callback will be called by the SDK when ready
      };

      script.onerror = () => {
        console.error('❌ Failed to load Spotify Web Playback SDK');
        window.__spotifyScriptLoading = false;
        setIsInitializing(false);
        setSdkLoaded(false);
        scriptElementRef.current = null;
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
            setCurrentPosition(0);
            setTrackDuration(0);
            return;
          }

          const typedState = state as Spotify.PlaybackState;
          setCurrentTrack(typedState.track_window.current_track);
          setIsActive(true);
          dispatch(setActive(true));
          
          // Update seek position
          updateSeekPosition(typedState);
          
          // Fetch devices when player becomes active
          if (!isActive) {
            fetchAvailableDevices();
          }
          
          // Only update Redux state for significant changes to avoid overriding button states
          // Check if the track has changed or if we're not in the middle of a user action
          const currentTrackId = typedState.track_window.current_track?.id;
          const shouldUpdateRedux = !typedState.paused || 
            (currentTrackId && (!currentTrack || (currentTrack as Spotify.Track)?.id !== currentTrackId));
          
          if (shouldUpdateRedux) {
            dispatch(updatePlayerState(typedState));
          }
        }) as (data: unknown) => void);

        // Ready
        player.addListener('ready', (({ device_id }: { device_id: string }) => {
          console.log('✅ Ready with Device ID', device_id);
          setPlayer(player);
          setIsInitializing(false);
          hasInitializedRef.current = true;
          
          // Only dispatch setDevice if the deviceId has actually changed
          if (device_id !== currentDeviceId) {
            dispatch(setDevice({ device_id, volume: 0.5 }));
          }

          // Fetch initial devices immediately
          fetchAvailableDevices();

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
  }, [accessToken, dispatch, isInitializing, sdkLoaded, currentDeviceId, fetchAvailableDevices, updateSeekPosition, isActive]);

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

    console.log('🎵 Dispatching playPlaylist thunk with trackIndex:', trackIndex);
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
      await dispatch(togglePlayPause({ accessToken })).unwrap();
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
      await dispatch(togglePlayPause({ accessToken })).unwrap();
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
      await dispatch(togglePlayPause({ accessToken })).unwrap();
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
      await dispatch(skipToNext({ accessToken, ...(currentDeviceId && { deviceId: currentDeviceId }) })).unwrap();
    } catch (error) {
      console.warn('⚠️ Error skipping to next track:', error);
    }
  }, [accessToken, currentDeviceId, dispatch]);

  const previousTrack = useCallback(async () => {
    console.log('🎵 previousTrack called');
    if (!accessToken) {
      console.warn('❌ No access token for previousTrack');
      return;
    }
    
    try {
      console.log('🎵 Dispatching skipToPrevious thunk');
      await dispatch(skipToPrevious({ accessToken, deviceId: currentDeviceId })).unwrap();
    } catch (error) {
      console.warn('⚠️ Error skipping to previous track:', error);
    }
  }, [accessToken, currentDeviceId, dispatch]);

  const setVolume = useCallback(async (volume: number) => {
    console.log('🎵 setVolume called:', volume);
    if (!accessToken) {
      console.warn('❌ No access token for setVolume');
      return;
    }
    
    try {
      console.log('🎵 Dispatching changeVolume thunk');
      await dispatch(changeVolume({ accessToken, deviceId: currentDeviceId, volume })).unwrap();
    } catch (error) {
      console.warn('⚠️ Error setting volume:', error);
    }
  }, [accessToken, currentDeviceId, dispatch]);

  // Fetch queue from Spotify API
  const fetchQueue = useCallback(async () => {
    if (!accessToken) {
      console.warn('❌ No access token for fetchQueue');
      return;
    }
    
    try {
      console.log('🎵 Fetching queue from Spotify API...');
      await dispatch(getQueue({ accessToken, deviceId: currentDeviceId })).unwrap();
    } catch (error) {
      console.warn('⚠️ Error fetching queue:', error);
    }
  }, [accessToken, currentDeviceId, dispatch]);

  const transferPlayback = useCallback(async (deviceId: string) => {
    console.log('🎵 transferPlayback called:', deviceId);
    if (!accessToken) {
      console.warn('❌ No access token for transferPlayback');
      return;
    }
    
    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false, // Don't start playing automatically
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to transfer playback: ${response.status}`);
      }

      console.log('✅ Playback transferred successfully to device:', deviceId);
      
      // Update the device in Redux store
      dispatch(setDevice({ device_id: deviceId, volume: 0.5 }));
      
    } catch (error) {
      console.error('❌ Error transferring playback:', error);
      throw error;
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

    // Set up periodic refresh of playback state and devices
    let refreshInterval: NodeJS.Timeout | null = null;
    let deviceRefreshInterval: NodeJS.Timeout | null = null;
    let seekUpdateInterval: NodeJS.Timeout | null = null;
    
    if (accessToken && currentDeviceId && isActive) {
      // Refresh playback state less frequently to avoid overriding button states
      refreshInterval = setInterval(() => {
        console.log('🔄 Refreshing playback state...');
        dispatch(getMyCurrentPlaybackState(accessToken));
      }, 3000); // Refresh every 3 seconds instead of 1
      
      // Fetch queue when player becomes active
      fetchQueue();
      
      // Also trigger enhanced queue refresh with longer delay
      setTimeout(() => {
        fetchQueue();
      }, 5000); // Longer delay to ensure playback state is stable
      
      // Refresh devices less frequently when player is active
      deviceRefreshInterval = setInterval(() => {
        console.log('📱 Refreshing devices...');
        fetchAvailableDevices();
      }, 10000); // Refresh devices every 10 seconds instead of 2
      
      // Update seek position less frequently for better performance
      seekUpdateInterval = setInterval(() => {
        if (playerInstanceRef.current) {
          playerInstanceRef.current.getCurrentState().then((state) => {
            if (state) {
              const typedState = state as Spotify.PlaybackState;
              updateSeekPosition(typedState);
            }
          }).catch((error) => {
            console.warn('⚠️ Error getting current state for seek update:', error);
          });
        }
      }, 2000); // Update seek position every 2 seconds instead of 1
    } else if (accessToken && currentDeviceId) {
      // Still fetch devices even when not active, but less frequently
      deviceRefreshInterval = setInterval(() => {
        console.log('📱 Refreshing devices (inactive)...');
        fetchAvailableDevices();
      }, 30000); // Refresh devices every 30 seconds when inactive
    }

    return () => {
      // Clean up refresh intervals
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      if (deviceRefreshInterval) {
        clearInterval(deviceRefreshInterval);
      }
      if (seekUpdateInterval) {
        clearInterval(seekUpdateInterval);
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
      
      // Clean up script element
      if (scriptElementRef.current && scriptElementRef.current.parentNode) {
        try {
          console.log('🧹 Cleaning up script element on unmount');
          scriptElementRef.current.parentNode.removeChild(scriptElementRef.current);
        } catch (error) {
          console.warn('⚠️ Error removing script element:', error);
        }
        scriptElementRef.current = null;
      }
      
      // Reset loading flag
      window.__spotifyScriptLoading = false;
      
      // Clean up timeouts
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
      }
      if (playbackStateTimeoutRef.current) {
        clearTimeout(playbackStateTimeoutRef.current);
      }
    };
  }, [accessToken, currentDeviceId, initializePlayer, dispatch, fetchAvailableDevices, updateSeekPosition, isActive, fetchQueue]);

  return {
    player,
    isActive,
    currentTrack,
    deviceId: currentDeviceId,
    currentPosition,
    trackDuration,
    playTrack,
    playPlaylist,
    togglePlay,
    pause,
    resume,
    nextTrack,
    previousTrack,
    setVolume,
    transferPlayback,
    fetchQueue,
  };
}