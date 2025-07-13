"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from '@/hooks/useSession';
import { likedSongsCache } from '@/lib/liked-songs-cache';
import { Playlist, Track } from '@/types/spotify';

interface UseLazyLikedSongsReturn {
  data: Playlist | null;
  isLoading: boolean;
  isInitialLoading: boolean;
  isBackgroundLoading: boolean;
  error: string | null;
  progress: { loaded: number; total: number; percentage: number };
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  isComplete: boolean;
}

export function useLazyLikedSongs(): UseLazyLikedSongsReturn {
  const { accessToken } = useSession();
  const [data, setData] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ loaded: 0, total: 0, percentage: 0 });
  const [isComplete, setIsComplete] = useState(false);
  
  const loadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const autoTriggerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize with cached data
  useEffect(() => {
    const cached = likedSongsCache.getCachedData();
    if (cached) {
      setData(cached.data);
      setProgress(likedSongsCache.getProgress());
      setIsComplete(cached.isComplete);
      console.log('📦 Loaded liked songs from cache:', { 
        tracks: cached.loadedTracks, 
        total: cached.totalTracks,
        isComplete: cached.isComplete 
      });
    }
  }, []);

  // Load initial batch
  const loadInitialBatch = useCallback(async () => {
    if (!accessToken || loadingRef.current) return;

    const cached = likedSongsCache.getCachedData();
    if (cached && !likedSongsCache.isCacheStale()) {
      return; // Use cached data if it's fresh
    }

    setIsInitialLoading(true);
    setError(null);
    loadingRef.current = true;

    try {
      console.log('🎵 Loading initial batch of liked songs...');
      
      const response = await fetch('/api/liked-songs/batch?offset=0&limit=50', {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch liked songs: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const playlistData: Playlist = {
          id: 'liked-songs',
          name: 'Liked Songs',
          description: `Your ${result.total} liked songs`,
          images: [{ url: '/heart-playlist.svg' }],
          owner: { display_name: 'You' },
          followers: { total: result.total },
          tracks: {
            items: result.tracks.map((track: Track) => ({
              track,
              added_at: new Date().toISOString()
            }))
          }
        };

        setData(playlistData);
        setProgress({ loaded: result.tracks.length, total: result.total, percentage: Math.round((result.tracks.length / result.total) * 100) });
        setIsComplete(result.tracks.length >= result.total);

        // Save to cache
        likedSongsCache.saveToCache(playlistData, result.total, result.tracks.length, result.tracks.length >= result.total);

        console.log('✅ Initial batch loaded:', { 
          tracks: result.tracks.length, 
          total: result.total,
          isComplete: result.tracks.length >= result.total 
        });
      } else {
        throw new Error(result.error || 'Failed to load liked songs');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('🛑 Initial batch loading aborted');
        return;
      }
      
      console.error('❌ Error loading initial batch:', err);
      setError(err instanceof Error ? err.message : 'Failed to load liked songs');
    } finally {
      setIsInitialLoading(false);
      loadingRef.current = false;
    }
  }, [accessToken]);

  // Load more tracks
  const loadMore = useCallback(async () => {
    console.log('🎯 Load more called:', { 
      hasToken: !!accessToken, 
      isLoading: loadingRef.current, 
      isComplete,
      currentTracks: data?.tracks?.items?.length || 0,
      totalTracks: data?.followers?.total || 0
    });
    
    if (!accessToken || loadingRef.current || isComplete) {
      console.log('🛑 Load more blocked:', { 
        hasToken: !!accessToken, 
        isLoading: loadingRef.current, 
        isComplete 
      });
      return;
    }

    setIsBackgroundLoading(true);
    loadingRef.current = true;

    try {
      const currentTracks = data?.tracks?.items?.length || 0;
      const totalTracks = data?.followers?.total || 0;
      const batchSize = likedSongsCache.getBatchSize();
      
      console.log('🎵 Loading more liked songs...', { 
        offset: currentTracks, 
        limit: batchSize, 
        currentTotal: totalTracks,
        progress: `${currentTracks}/${totalTracks}`
      });
      
      const response = await fetch(`/api/liked-songs/batch?offset=${currentTracks}&limit=${batchSize}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch more liked songs: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.tracks.length > 0) {
        const newTracks = result.tracks as Track[];
        const updatedTracks = [...(data?.tracks?.items || []), ...newTracks.map(track => ({ track, added_at: new Date().toISOString() }))];
        
        const updatedData: Playlist = {
          ...data!,
          tracks: { items: updatedTracks }
        };

        const newLoadedCount = updatedTracks.length;
        const newIsComplete = newLoadedCount >= totalTracks;
        
        setData(updatedData);
        setProgress({ 
          loaded: newLoadedCount, 
          total: totalTracks, 
          percentage: Math.round((newLoadedCount / totalTracks) * 100) 
        });
        setIsComplete(newIsComplete);

        // Update cache
        likedSongsCache.updateCache(newTracks, newLoadedCount, newIsComplete);

        // Log detailed completion status
        console.log('📊 Completion status:', {
          loaded: newLoadedCount,
          total: totalTracks,
          remaining: totalTracks - newLoadedCount,
          isComplete: newIsComplete,
          canLoadMore: likedSongsCache.canLoadMore()
        });

        console.log('✅ More tracks loaded:', { 
          newTracks: newTracks.length, 
          totalLoaded: newLoadedCount,
          totalExpected: totalTracks,
          isComplete: newIsComplete,
          remaining: totalTracks - newLoadedCount
        });
        
        // If we're not complete and there are more tracks to load, trigger another load
        if (!newIsComplete && totalTracks > newLoadedCount) {
          console.log('🔄 Auto-triggering next batch...');
          
          // Clear any existing auto-trigger to prevent multiple timers
          if (autoTriggerRef.current) {
            clearTimeout(autoTriggerRef.current);
          }
          
          // Use setTimeout to avoid blocking the UI and prevent infinite loops
          autoTriggerRef.current = setTimeout(() => {
            // Check current state to avoid infinite loops
            if (!newIsComplete && !loadingRef.current) {
              console.log('🔄 Executing auto-triggered load more...');
              loadMore();
            } else {
              console.log('🛑 Auto-trigger blocked:', { 
                newIsComplete, 
                loadingRef: loadingRef.current 
              });
            }
            autoTriggerRef.current = null;
          }, 300); // Increased delay to prevent rapid successive calls
        }
      } else if (result.success && result.tracks.length === 0) {
        // No more tracks to load
        setIsComplete(true);
        console.log('✅ All liked songs loaded - no more tracks returned');
      } else {
        throw new Error(result.error || 'Failed to load more liked songs');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('🛑 Load more aborted');
        return;
      }
      
      console.error('❌ Error loading more tracks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load more tracks');
    } finally {
      setIsBackgroundLoading(false);
      loadingRef.current = false;
    }
  }, [accessToken, data, isComplete]);

  // Refresh data
  const refresh = useCallback(async () => {
    // Clear cache and reload
    likedSongsCache.clearCache();
    setData(null);
    setProgress({ loaded: 0, total: 0, percentage: 0 });
    setIsComplete(false);
    setError(null);
    
    await loadInitialBatch();
  }, [loadInitialBatch]);

  // Start loading when component mounts
  useEffect(() => {
    if (accessToken && !data) {
      loadInitialBatch();
    }
  }, [accessToken, data, loadInitialBatch]);

  // Auto-load more when user scrolls near the end
  useEffect(() => {
    if (!isComplete && !isBackgroundLoading && data) {
      const handleScroll = () => {
        const scrollTop = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // Load more when user is 70% down the page (more aggressive)
        if (scrollTop + windowHeight >= documentHeight * 0.7) {
          console.log('📜 Scroll triggered load more:', {
            scrollTop,
            windowHeight,
            documentHeight,
            threshold: documentHeight * 0.7
          });
          loadMore();
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isComplete, isBackgroundLoading, data, loadMore]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (autoTriggerRef.current) {
        clearTimeout(autoTriggerRef.current);
      }
    };
  }, []);

  return {
    data,
    isLoading: isInitialLoading || isLoading,
    isInitialLoading,
    isBackgroundLoading,
    error,
    progress,
    loadMore,
    refresh,
    isComplete,
  };
} 