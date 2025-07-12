"use client";

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useSpotifyPlayerContext } from '@/components/SpotifyPlayerProvider';
import { RootState } from '@/redux/store';

export function useSeamlessPlayback() {
  const { nextTrack } = useSpotifyPlayerContext();
  const { isPlaying, currentTrack, positionMs, repeatMode, queue } = useSelector((state: RootState) => state.player);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Only handle seamless playback when:
    // 1. A track is currently playing
    // 2. Repeat mode is off
    // 3. We have a valid current track with duration
    // 4. We're very close to the end (within 1 second)
    // 5. There are no tracks in the queue (playing a single track)
    if (isPlaying && 
        repeatMode === 'off' && 
        currentTrack && 
        currentTrack.duration_ms > 0 &&
        (!queue?.queue || queue.queue.length === 0)) {
      
      const remainingTime = currentTrack.duration_ms - positionMs;
      
      // Only advance if we're very close to the end
      if (remainingTime <= 1000 && remainingTime > 0) {
        console.log('🎵 Single track ending, advancing to next track for seamless playback');
        
        timeoutRef.current = setTimeout(() => {
          console.log('🎵 Track ended, advancing to next track');
          nextTrack();
        }, remainingTime);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isPlaying, currentTrack, positionMs, repeatMode, nextTrack, queue]);
} 