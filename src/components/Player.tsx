"use client";

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSpotifyPlayerContext } from './SpotifyPlayerProvider';
import PlayButton from './PlayButton';
import ProgressBar from './ProgressBar';
import Image from 'next/image';

import { seekToPosition, changeVolume } from '@/redux/thunks/playerThunks';
import { useSession } from '@/hooks/useSession';
import type { RootState, AppDispatch } from '@/redux/store';
import type { SimpleTrack } from '@/types';

export function Player() {
  const dispatch = useDispatch<AppDispatch>();
  const { accessToken } = useSession();
  const {
    deviceId,
    togglePlay,
    nextTrack,
    previousTrack,
    error,
    clearError,
  } = useSpotifyPlayerContext();

  // Use Redux state for better synchronization
  const { isPlaying, currentTrack, isActive, positionMs, volume } = useSelector((state: RootState) => state.player);

  // Handle volume change
  const handleVolumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    console.log('🎵 Volume change:', newVolume);
    
    if (accessToken) {
      try {
        const result = await dispatch(changeVolume({ accessToken, volumePercent: Math.round(newVolume * 100) })).unwrap();
        console.log('✅ Volume changed successfully:', result);
      } catch (error) {
        console.warn('⚠️ Error changing volume:', error);
      }
    }
  };

  // Handle seek change
  const handleSeekChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentTrack || !accessToken) return;
    
    const seekPercentage = parseFloat(e.target.value);
    const newPositionMs = Math.round((seekPercentage / 100) * currentTrack.duration_ms);
    console.log('🎵 Seek change:', { seekPercentage, newPositionMs, duration: currentTrack.duration_ms });
    
    try {
      const result = await dispatch(seekToPosition({ accessToken, positionMs: newPositionMs })).unwrap();
      console.log('✅ Seek successful:', result);
    } catch (error) {
      console.warn('⚠️ Error seeking:', error);
    }
  };

  // Show error state if there's an error
  if (error) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-red-50 border-t border-red-200 p-4 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Show player even when not active, but with different content
  if (!isActive || !currentTrack) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-4 z-50">
        <div className="flex flex-col max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-700 rounded flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.369 4.369 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-medium">No track playing</h3>
                <p className="text-gray-400 text-sm">
                  {deviceId ? 'Ready to play' : 'Connecting to Spotify...'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={previousTrack}
                className="text-gray-400 hover:text-white disabled:opacity-50"
                disabled={!deviceId}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                </svg>
              </button>

              <PlayButton onClick={togglePlay} disabled={!deviceId} isPlaying={isPlaying} />

              <button
                onClick={nextTrack}
                className="text-gray-400 hover:text-white disabled:opacity-50"
                disabled={!deviceId}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
                </svg>
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => {/* TODO: Implement device picker modal */}}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20"
                disabled={!deviceId}
              />
            </div>
          </div>
          <div className="mt-3">
            <ProgressBar 
              value={0} 
              onChange={() => {}} 
              variant="track"
              disabled={true}
            />
          </div>
        </div>
      </div>
    );
  }

  const track = currentTrack as SimpleTrack;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-4 z-50">
      <div className="flex flex-col max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Image
              src={track.album.images[0]?.url || '/placeholder.png'}
              alt={track.name}
              className="w-16 h-16 rounded"
              width={64}
              height={64}
              priority
            />
            <div>
              <h3 className="text-white font-medium">{track.name}</h3>
              <p className="text-gray-400 text-sm">{track.artists[0]?.name || ''}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={previousTrack}
              className="text-white hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
              </svg>
            </button>

            <PlayButton onClick={togglePlay} isPlaying={isPlaying} />

            <button
              onClick={nextTrack}
              className="text-white hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
              </svg>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => {/* TODO: Implement device picker modal */}}
              className="text-white hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20"
            />
          </div>
        </div>
        <div className="mt-3">
          <ProgressBar 
            value={track.duration_ms > 0 ? (positionMs / track.duration_ms) * 100 : 0} 
            onChange={handleSeekChange} 
            variant="track"
          />
        </div>
      </div>
    </div>
  );
}