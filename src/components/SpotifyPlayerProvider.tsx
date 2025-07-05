"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';

const SpotifyPlayerContext = createContext<ReturnType<typeof useSpotifyPlayer> | null>(null);

export function SpotifyPlayerProvider({ children }: { children: ReactNode }) {
  const player = useSpotifyPlayer();

  return (
    <SpotifyPlayerContext.Provider value={player}>
      {children}
    </SpotifyPlayerContext.Provider>
  );
}

export function useSpotifyPlayerContext() {
  const context = useContext(SpotifyPlayerContext);
  if (!context) {
    throw new Error('useSpotifyPlayerContext must be used within SpotifyPlayerProvider');
  }
  return context;
} 