"use client";

import React from 'react';
import Image from 'next/image';
import { useNowPlaying } from '@/hooks/useNowPlaying';
import { Play, Pause, Music } from 'lucide-react';
import { useSpotifyPlayerContext } from './SpotifyPlayerProvider';

export default function NowPlayingCard() {
  const { nowPlaying, isLoading, error } = useNowPlaying();
  const { togglePlay, deviceId } = useSpotifyPlayerContext();

  if (isLoading) {
    return (
      <div className="bg-neutral-900 rounded-lg p-6 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-neutral-800 rounded-md"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-neutral-800 rounded w-3/4"></div>
            <div className="h-3 bg-neutral-800 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-neutral-900 rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-red-900/20 rounded-md flex items-center justify-center">
            <Music className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-medium">Unable to load playback</h3>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!nowPlaying.currentTrack) {
    return (
      <div className="bg-neutral-900 rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-neutral-800 rounded-md flex items-center justify-center">
            <Music className="w-8 h-8 text-neutral-400" />
          </div>
          <div>
            <h3 className="text-white font-medium">No track playing</h3>
            <p className="text-neutral-400 text-sm">
              {deviceId ? 'Ready to play music' : 'Connecting to Spotify...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const track = nowPlaying.currentTrack;
  const progressPercentage = nowPlaying.duration > 0 
    ? (nowPlaying.progress / nowPlaying.duration) * 100 
    : 0;

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-neutral-900 rounded-lg p-6 hover:bg-neutral-800 transition-colors cursor-pointer">
      <div className="flex items-center space-x-4">
        <div className="relative w-16 h-16 flex-shrink-0">
          {track.album?.images?.[0]?.url ? (
            <Image
              src={track.album.images[0].url}
              alt={track.name}
              fill
              className="object-cover rounded-md"
              sizes="64px"
            />
          ) : (
            <div className="w-full h-full bg-neutral-800 rounded-md flex items-center justify-center">
              <Music className="w-8 h-8 text-neutral-400" />
            </div>
          )}
          
          {/* Play/Pause overlay */}
          <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="text-white hover:text-green-400 transition-colors"
            >
              {nowPlaying.isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate">{track.name}</h3>
          <p className="text-neutral-400 text-sm truncate">
            {track.artists?.map(a => a.name).join(', ')}
          </p>
          
          {/* Progress bar */}
          <div className="mt-2">
            <div className="flex justify-between text-xs text-neutral-500 mb-1">
              <span>{formatTime(nowPlaying.progress)}</span>
              <span>{formatTime(nowPlaying.duration)}</span>
            </div>
            <div className="w-full bg-neutral-800 rounded-full h-1">
              <div 
                className="bg-green-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Device indicator */}
        {nowPlaying.device && (
          <div className="text-right">
            <p className="text-xs text-neutral-500">Playing on</p>
            <p className="text-xs text-neutral-400 truncate max-w-24">
              {nowPlaying.device.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 