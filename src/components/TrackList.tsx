"use client";

import React from 'react';
import Image from 'next/image';
import { Heart, Play } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { likeTrack, unlikeTrack } from '@/redux/thunks/playerThunks';
import { selectPlayerState } from '@/redux/slices/playerSlice';
import { useSession } from '@/hooks/useSession';
import { AppDispatch } from '@/redux/store';

interface Track {
  id: string;
  name: string;
  duration_ms: number;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  uri?: string;
}

interface TrackListProps {
  tracks: Track[];
  onTrackClick?: (track: Track, index: number) => void;
}

const TrackList = ({ tracks, onTrackClick }: TrackListProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { likedTracks } = useSelector(selectPlayerState);
  const { accessToken } = useSession();

  const handleLikeClick = (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!accessToken || !track.id || track.id === 'undefined') {
      console.warn('Cannot like/unlike track: missing accessToken or invalid track ID', {
        accessToken: !!accessToken,
        trackId: track.id,
        trackName: track.name
      });
      return;
    }

    const isLiked = likedTracks?.includes(track.id);
    
    if (isLiked) {
      dispatch(unlikeTrack({ accessToken, trackId: track.id }));
    } else {
      dispatch(likeTrack({ accessToken, trackId: track.id }));
    }
  };

  const handleTrackClick = (track: Track, index: number) => {
    console.log('Track clicked:', { track, index, onTrackClick: !!onTrackClick });
    if (onTrackClick) {
      onTrackClick(track, index);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {tracks.map((track, index) => {
        const isLiked = likedTracks?.includes(track.id);
        
        return (
          <div 
            key={track.id} 
            className="flex items-center gap-4 hover:bg-neutral-800 p-2 rounded group cursor-pointer"
            onClick={() => handleTrackClick(track, index)}
          >
            <div className="relative">
              <Image
                src={track.album.images[0]?.url || '/placeholder.png'}
                alt={track.name}
                width={48}
                height={48}
                className="rounded"
                loading="lazy"
                fetchPriority="low"
              />
              
              {/* Play button overlay */}
              <div className="absolute inset-0 bg-black/60 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play size={20} fill="white" className="text-white" />
              </div>
            </div>
            
            <div className="flex-1">
              <p className="font-medium truncate text-white">{track.name}</p>
              <p className="text-neutral-400 text-sm truncate">
                {track.artists.map((artist) => artist.name).join(', ')}
              </p>
            </div>
            
            {/* Like button */}
            <button
              aria-label={isLiked ? 'Unlike' : 'Like'}
              className={`p-2 rounded-full hover:bg-neutral-700 transition-colors ${
                isLiked ? 'text-green-500' : 'text-neutral-400'
              }`}
              onClick={(e) => handleLikeClick(track, e)}
            >
              <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" />
            </button>
            
            <p className="text-neutral-400 text-sm">
              {Math.floor(track.duration_ms / 60000)}:{((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0')}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default TrackList;