"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';
import { useLikedTracks } from '@/hooks/useLikedTracks';

interface SpotifyPlayerContextType {
  player: unknown;
  isActive: boolean;
  currentTrack: unknown;
  deviceId: string | null;
  currentPosition: number;
  trackDuration: number;
  playTrack: (trackUri: string) => void;
  playPlaylist: (playlistUri: string, trackIndex?: number) => void;
  togglePlay: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  transferPlayback: (deviceId: string) => Promise<void>;
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
  } = useSpotifyPlayer();

  // Initialize liked tracks
  useLikedTracks();

  // Global error handler for Spotify Web Playback SDK
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      // Enhanced filtering for permissions policy violations and expected errors
      if (event.message.includes('Permissions policy violation') ||
          event.message.includes('unload is not allowed') ||
          event.message.includes('beforeunload') ||
          event.message.includes('unload-event') ||
          event.message.includes('robustness level') ||
          event.message.includes('message channel closed') ||
          event.message.includes('check_scope') ||
          event.message.includes('melody/v1/check_scope')) {
        return; // Ignore all permissions policy violations and expected errors
      }
      
      if (event.message.includes('Spotify') || event.message.includes('WebSocket')) {
        console.warn('Spotify Web Playback SDK error:', event.message);
        setError('Spotify player connection issue. Please refresh the page.');
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Filter out expected promise rejections
      if (event.reason && typeof event.reason === 'object') {
        const reason = event.reason as any;
        if (reason.message && (
          reason.message.includes('message channel closed') ||
          reason.message.includes('check_scope') ||
          reason.message.includes('melody/v1/check_scope') ||
          reason.message.includes('robustness level')
        )) {
          return; // Ignore expected promise rejections
        }
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const clearError = () => setError(null);

  const contextValue: SpotifyPlayerContextType = {
    player,
    isActive,
    currentTrack,
    deviceId,
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