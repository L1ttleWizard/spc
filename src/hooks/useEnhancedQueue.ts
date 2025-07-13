"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useSession } from '@/hooks/useSession';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { RootState } from '@/redux/store';

interface EnhancedQueueState {
  currentlyPlaying: SpotifyApi.TrackObjectFull | null;
  queue: SpotifyApi.TrackObjectFull[];
  context: {
    type: 'playlist' | 'album' | 'artist' | 'unknown';
    id: string | null;
    name: string | null;
    uri: string | null;
  };
  isLoading: boolean;
  error: string | null;
}

export function useEnhancedQueue(sidebarOpen: boolean = false) {
  const { accessToken } = useSession();
  const { queue: spotifyQueue, currentTrack } = useSelector((state: RootState) => state.player);
  
  // Monitor performance
  usePerformanceMonitor('useEnhancedQueue');
  const [enhancedQueue, setEnhancedQueue] = useState<EnhancedQueueState>({
    currentlyPlaying: null,
    queue: [],
    context: { type: 'unknown', id: null, name: null, uri: null },
    isLoading: false,
    error: null,
  });

  // Add refs to track last update time and prevent excessive updates
  const lastUpdateRef = useRef<number>(0);
  const lastTrackIdRef = useRef<string | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch current playback context to determine what's playing
  const fetchCurrentContext = useCallback(async () => {
    if (!accessToken) return;

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const playbackData = await response.json();
        if (playbackData?.context) {
          const context = playbackData.context;
          const contextUri = context.uri;
          
          // Parse context URI to get type and ID
          const uriParts = contextUri.split(':');
          const type = uriParts[1] as 'playlist' | 'album' | 'artist';
          const id = uriParts[2] || null;
          
          return { type, id, uri: contextUri };
        }
      }
    } catch (error) {
      console.warn('⚠️ Error fetching current context:', error);
    }
    
    return null;
  }, [accessToken]);

  // Fetch liked songs for queue building
  const fetchLikedSongs = useCallback(async () => {
    if (!accessToken) return [];

    try {
      const response = await fetch('/api/liked-songs', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        return data.tracks?.items?.map((item: any) => item.track).filter(Boolean) || [];
      }
    } catch (error) {
      console.warn('⚠️ Error fetching liked songs for queue:', error);
    }
    
    return [];
  }, [accessToken]);

  // Fetch full playlist tracks
  const fetchPlaylistTracks = useCallback(async (playlistId: string) => {
    if (!accessToken) return [];

    try {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        return data.items.map((item: any) => item.track).filter(Boolean);
      }
    } catch (error) {
      console.warn('⚠️ Error fetching playlist tracks:', error);
    }
    
    return [];
  }, [accessToken]);

  // Fetch full album tracks
  const fetchAlbumTracks = useCallback(async (albumId: string) => {
    if (!accessToken) return [];

    try {
      const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        return data.items;
      }
    } catch (error) {
      console.warn('⚠️ Error fetching album tracks:', error);
    }
    
    return [];
  }, [accessToken]);

  // Get playlist/album name
  const fetchContextName = useCallback(async (type: string, id: string) => {
    if (!accessToken) return null;

    try {
      const endpoint = type === 'playlist' 
        ? `https://api.spotify.com/v1/playlists/${id}`
        : `https://api.spotify.com/v1/albums/${id}`;
      
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        return data.name;
      }
    } catch (error) {
      console.warn('⚠️ Error fetching context name:', error);
    }
    
    return null;
  }, [accessToken]);

  // Build enhanced queue with performance optimization
  const buildEnhancedQueue = useCallback(async () => {
    if (!accessToken || !currentTrack) return;

    setEnhancedQueue(prev => ({ ...prev, isLoading: true, error: null }));

    // Use requestIdleCallback for heavy operations to avoid blocking the main thread
    const runHeavyOperation = (operation: () => Promise<void>) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => operation(), { timeout: 2000 });
      } else {
        // Fallback for browsers that don't support requestIdleCallback
        setTimeout(operation, 0);
      }
    };

    runHeavyOperation(async () => {
      try {
        // First, get the current context
        const context = await fetchCurrentContext();
      
      if (!context) {
        // No context, use Spotify queue as fallback
        if (spotifyQueue) {
          setEnhancedQueue({
            currentlyPlaying: spotifyQueue.currently_playing,
            queue: spotifyQueue.queue || [],
            context: { type: 'unknown', id: null, name: null, uri: null },
            isLoading: false,
            error: null,
          });
        }
        return;
      }

      // Get context name
      const contextName = context.id && typeof context.id === 'string' ? await fetchContextName(context.type, context.id) : null;

      let allTracks: SpotifyApi.TrackObjectFull[] = [];
      
      if (context.type === 'playlist' && context.id && typeof context.id === 'string') {
        allTracks = await fetchPlaylistTracks(context.id);
      } else if (context.type === 'album' && context.id && typeof context.id === 'string') {
        const albumTracks = await fetchAlbumTracks(context.id);
        // For albums, we need to get full track objects
        if (albumTracks.length > 0) {
          const trackIds = albumTracks.map((track: any) => track.id).join(',');
          const tracksResponse = await fetch(`https://api.spotify.com/v1/tracks?ids=${trackIds}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (tracksResponse.ok) {
            const tracksData = await tracksResponse.json();
            allTracks = tracksData.tracks;
          }
        }
      }

      if (allTracks.length > 0) {
        // Find current track position in the context
        const currentTrackIndex = allTracks.findIndex(track => track.id === currentTrack.id);
        
        if (currentTrackIndex !== -1) {
          // Build queue from current position onwards, removing duplicates
          const remainingTracks = allTracks.slice(currentTrackIndex + 1);
          const seenIds = new Set();
          const queue = remainingTracks.filter(track => {
            if (seenIds.has(track.id)) {
              return false; // Skip duplicate
            }
            seenIds.add(track.id);
            return true;
          });
          
          setEnhancedQueue({
            currentlyPlaying: currentTrack as any,
            queue,
            context: {
              type: context.type,
              id: context.id,
              name: contextName,
              uri: context.uri,
            },
            isLoading: false,
            error: null,
          });

          // Don't update Redux store to avoid interfering with track playing
          // Only use enhanced queue for display purposes
          console.log('🎵 Enhanced queue built for display (not updating Redux)');
        }
      } else {
        // Check if we're playing from liked songs (no context but current track exists)
        if (!context && currentTrack) {
          console.log('🎵 No context found, checking if playing from liked songs...');
          
          // Fetch liked songs and check if current track is in them
          const likedSongs = await fetchLikedSongs();
          const currentTrackInLiked = likedSongs.find(track => track.id === currentTrack.id);
          
          if (currentTrackInLiked) {
            console.log('❤️ Current track found in liked songs, building liked songs queue');
            
            // Find current track position in liked songs
            const currentTrackIndex = likedSongs.findIndex(track => track.id === currentTrack.id);
            
            if (currentTrackIndex !== -1) {
              // Build queue from current position onwards, removing duplicates
              const remainingTracks = likedSongs.slice(currentTrackIndex + 1);
              const seenIds = new Set();
              const queue = remainingTracks.filter(track => {
                if (seenIds.has(track.id)) {
                  return false; // Skip duplicate
                }
                seenIds.add(track.id);
                return true;
              });
              
              setEnhancedQueue({
                currentlyPlaying: currentTrack as any,
                queue,
                context: {
                  type: 'playlist',
                  id: 'liked-songs',
                  name: 'Liked Songs',
                  uri: null,
                },
                isLoading: false,
                error: null,
              });

              // Don't update Redux store to avoid interfering with track playing
              // Only use enhanced queue for display purposes
              console.log('🎵 Enhanced queue built for liked songs (not updating Redux)');
              
              return; // Exit early since we handled liked songs
            }
          }
        }
        
        // Fallback to Spotify queue
        if (spotifyQueue) {
          // Remove duplicates from Spotify queue as well
          const spotifyQueueTracks = spotifyQueue.queue || [];
          const seenIds = new Set();
          const filteredQueue = spotifyQueueTracks.filter(track => {
            if (seenIds.has(track.id)) {
              return false; // Skip duplicate
            }
            seenIds.add(track.id);
            return true;
          });
          
          setEnhancedQueue({
            currentlyPlaying: spotifyQueue.currently_playing,
            queue: filteredQueue,
            context: {
              type: context?.type || 'unknown',
              id: context?.id || null,
              name: contextName,
              uri: context?.uri || null,
            },
            isLoading: false,
            error: null,
          });
        }
      }
    } catch (error) {
      console.warn('⚠️ Error building enhanced queue:', error);
      setEnhancedQueue(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to build queue' 
      }));
    }
    });
  }, [accessToken, currentTrack, spotifyQueue, fetchCurrentContext, fetchPlaylistTracks, fetchAlbumTracks, fetchContextName, fetchLikedSongs]);

  // Fetch Spotify queue - simplified to avoid Redux interference
  const fetchSpotifyQueue = useCallback(async () => {
    if (!accessToken) return;

    try {
      // Just log that we would fetch the queue, but don't actually do it
      // to avoid interfering with track playing
      console.log('🎵 Would fetch Spotify queue (skipped to avoid interference)');
    } catch (error) {
      console.warn('⚠️ Error fetching Spotify queue:', error);
    }
  }, [accessToken]);

  // Initialize and refresh queue with throttling - only when sidebar is open
  useEffect(() => {
    if (!accessToken || !currentTrack || !sidebarOpen) return;

    const currentTrackId = currentTrack.id;
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;
    const minUpdateInterval = 3000; // Minimum 3 seconds between updates
    const trackChanged = lastTrackIdRef.current !== currentTrackId;

    // Clear any pending timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // If track changed, update immediately but throttle subsequent updates
    if (trackChanged) {
      console.log('🎵 Track changed, updating queue immediately');
      lastTrackIdRef.current = currentTrackId;
      lastUpdateRef.current = now;
      
      // First fetch Spotify queue
      fetchSpotifyQueue();
      
      // Then build enhanced queue with a small delay
      updateTimeoutRef.current = setTimeout(() => {
        buildEnhancedQueue();
      }, 500);
    } else if (timeSinceLastUpdate >= minUpdateInterval) {
      // Only update if enough time has passed
      console.log('🔄 Periodic queue update');
      lastUpdateRef.current = now;
      
      fetchSpotifyQueue();
      updateTimeoutRef.current = setTimeout(() => {
        buildEnhancedQueue();
      }, 500);
    } else {
      // Schedule update for later
      const delay = minUpdateInterval - timeSinceLastUpdate;
      console.log(`⏰ Scheduling queue update in ${delay}ms`);
      updateTimeoutRef.current = setTimeout(() => {
        lastUpdateRef.current = Date.now();
        fetchSpotifyQueue();
        setTimeout(() => {
          buildEnhancedQueue();
        }, 500);
      }, delay);
    }

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [accessToken, currentTrack?.id, sidebarOpen, fetchSpotifyQueue, buildEnhancedQueue]);

  return {
    ...enhancedQueue,
    refresh: buildEnhancedQueue,
    fetchSpotifyQueue,
  };
} 