"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/hooks/useSession';
import { useDispatch } from 'react-redux';
import { getMyCurrentPlaybackState } from '@/redux/thunks/playerThunks';
import { AppDispatch } from '@/redux/store';

interface NowPlayingState {
  isPlaying: boolean;
  currentTrack: SpotifyApi.TrackObjectFull | null;
  progress: number;
  duration: number;
  device: SpotifyApi.UserDevice | null;
  lastUpdated: number;
}

export function useNowPlaying() {
  const { accessToken } = useSession();
  const dispatch = useDispatch<AppDispatch>();
  const [nowPlaying, setNowPlaying] = useState<NowPlayingState>({
    isPlaying: false,
    currentTrack: null,
    progress: 0,
    duration: 0,
    device: null,
    lastUpdated: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current playback state
  const fetchCurrentPlayback = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('🎵 Fetching current playback state...');
      const result = await dispatch(getMyCurrentPlaybackState(accessToken)).unwrap();
      
      if (result) {
        // Something is currently playing
        setNowPlaying({
          isPlaying: !result.is_playing,
          currentTrack: result.item,
          progress: result.progress_ms || 0,
          duration: result.item?.duration_ms || 0,
          device: result.device,
          lastUpdated: Date.now(),
        });
        console.log('✅ Current playback found:', {
          track: result.item?.name,
          artist: result.item?.artists?.[0]?.name,
          isPlaying: !result.is_playing,
          device: result.device?.name,
        });
      } else {
        // Nothing is currently playing
        setNowPlaying(prev => ({
          ...prev,
          isPlaying: false,
          currentTrack: null,
          progress: 0,
          duration: 0,
          device: null,
          lastUpdated: Date.now(),
        }));
        console.log('ℹ️ No current playback found');
      }
    } catch (err) {
      console.warn('⚠️ Error fetching current playback:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch playback state');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, dispatch]);

  // Initial fetch when component mounts
  useEffect(() => {
    if (accessToken) {
      fetchCurrentPlayback();
    }
  }, [accessToken, fetchCurrentPlayback]);

  // Set up periodic refresh (every 30 seconds)
  useEffect(() => {
    if (!accessToken) return;

    const interval = setInterval(() => {
      fetchCurrentPlayback();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [accessToken, fetchCurrentPlayback]);

  // Update progress for currently playing tracks
  useEffect(() => {
    if (!nowPlaying.isPlaying || !nowPlaying.currentTrack) return;

    const interval = setInterval(() => {
      setNowPlaying(prev => {
        if (!prev.isPlaying || !prev.currentTrack) return prev;
        
        const newProgress = Math.min(prev.progress + 1000, prev.duration);
        return {
          ...prev,
          progress: newProgress,
        };
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [nowPlaying.isPlaying, nowPlaying.currentTrack]);

  return {
    nowPlaying,
    isLoading,
    error,
    refresh: fetchCurrentPlayback,
  };
} 