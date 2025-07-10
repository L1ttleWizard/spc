"use client";

import React from 'react';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import PlayButton from './PlayButton';

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

export default function TrackList({ tracks, onTrackClick }: TrackListProps): JSX.Element {
  const formatDuration = (durationMs: number) => {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = String(Math.floor((durationMs % 60000) / 1000)).padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const handleTrackClick = (track: Track, index: number) => {
    onTrackClick?.(track, index);
  };

  return (
    <div className="bg-neutral-900/50 rounded-lg p-4">
      {/* Заголовок таблицы */}
      <div className="grid grid-cols-[16px_4fr_2fr_1fr] gap-4 px-4 py-2 text-neutral-400 text-sm border-b border-neutral-800">
        <div>#</div>
        <div>Название</div>
        <div>Альбом</div>
        <div className="flex justify-center">
          <Clock size={16} />
        </div>
      </div>

      {/* Список треков */}
      <div className="space-y-1">
        {tracks.map((track, idx) => (
          <div 
            key={track.id} 
            className="grid grid-cols-[16px_4fr_2fr_1fr] gap-4 px-4 py-3 rounded-md hover:bg-neutral-800/50 group cursor-pointer transition-colors duration-200"
            onClick={() => handleTrackClick(track, idx)}
            onDoubleClick={() => handleTrackClick(track, idx)}
          >
            {/* Номер трека / Кнопка воспроизведения */}
            <div className="flex items-center justify-center relative">
              <span className="text-neutral-400 text-sm transition-opacity duration-200 group-hover:opacity-0">
                {idx + 1}
              </span>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <PlayButton 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTrackClick(track, idx);
                  }}
                />
              </div>
            </div>
            
            {/* Информация о треке */}
            <div className="flex items-center gap-4 min-w-0">
              {track.album?.images?.[0]?.url && (
                <Image
                  src={track.album.images[0].url}
                  alt={track.name}
                  width={40}
                  height={40}
                  className="rounded"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-white font-medium truncate">{track.name}</div>
                <div className="text-neutral-400 text-sm truncate">
                  {track.artists.map((a) => a.name).join(', ')}
                </div>
              </div>
            </div>
            
            {/* Название альбома */}
            <div className="flex items-center text-neutral-400 text-sm truncate">
              {track.album?.name}
            </div>
            
            {/* Длительность */}
            <div className="flex items-center justify-center text-neutral-400 text-sm">
              {formatDuration(track.duration_ms)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 