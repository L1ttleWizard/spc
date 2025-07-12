"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';
import { useLikedTracks } from '@/hooks/useLikedTracks';

interface SpotifyPlayerContextType {
  player: unknown;
  isActive: boolean;
  currentTrack: unknown;
  deviceId: string | null;
  playTrack: (trackUri: string) => void;
  playPlaylist: (playlistUri: string, trackIndex?: number) => void;
  togglePlay: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const SpotifyPlayerContext = createContext<SpotifyPlayerContextType | undefined>(undefined);

export function SpotifyPlayerProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  
  const {
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
  } = useSpotifyPlayer();

  // Initialize liked tracks
  useLikedTracks();

  // Global error handler for Spotify Web Playback SDK
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      // Enhanced filtering for permissions policy violations
      if (event.message.includes('Permissions policy violation') ||
          event.message.includes('unload is not allowed') ||
          event.message.includes('beforeunload') ||
          event.message.includes('unload-event')) {
        return; // Ignore all permissions policy violations
      }
      
      if (event.message.includes('Spotify') || event.message.includes('WebSocket')) {
        console.warn('Spotify Web Playback SDK error:', event.message);
        setError('Spotify player connection issue. Please refresh the page.');
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Enhanced filtering for common non-critical rejections
      if (event.reason && typeof event.reason === 'string') {
        if (event.reason.includes('Permissions policy violation') || 
            event.reason.includes('unload is not allowed') ||
            event.reason.includes('beforeunload') ||
            event.reason.includes('unload-event') ||
            event.reason.includes('message channel closed')) {
          return; // Ignore these common non-critical errors
        }
        
        if (event.reason.includes('Spotify') || event.reason.includes('WebSocket')) {
          console.warn('Spotify Web Playback SDK promise rejection:', event.reason);
          setError('Spotify player connection issue. Please refresh the page.');
        }
      }
    };

    // Only add listeners if we're in a browser environment
    if (typeof window !== 'undefined') {
      window.addEventListener('error', handleGlobalError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('error', handleGlobalError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      }
    };
  }, []);

  const clearError = () => setError(null);

  const contextValue: SpotifyPlayerContextType = {
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
    error,
    clearError,
  };

  return (
    <SpotifyPlayerContext.Provider value={contextValue}>
      {children}
    </SpotifyPlayerContext.Provider>
  );
}

export function useSpotifyPlayerContext() {
  const context = useContext(SpotifyPlayerContext);
  if (context === undefined) {
    throw new Error('useSpotifyPlayerContext must be used within a SpotifyPlayerProvider');
  }
  return context;
} 