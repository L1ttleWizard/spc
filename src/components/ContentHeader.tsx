"use client";

import React from 'react';
import Image from 'next/image';
import { Play, Heart, MoreHorizontal } from 'lucide-react';

interface ContentHeaderProps {
  type: 'playlist' | 'album' | 'content';
  name: string;
  imageUrl?: string;
  owner?: string;
  artist?: string;
  trackCount: number;
  followers?: number;
  onPlay?: () => void;
  deviceId?: string | null;
}

export default function ContentHeader({
  type,
  name,
  imageUrl,
  owner,
  artist,
  trackCount,
  followers,
  onPlay,
  deviceId
}: ContentHeaderProps) {
  const displayName = owner || artist;
  const canPlay = deviceId && onPlay;

  return (
    <>
      {/* Header без градиента */}
      <div className="relative">
        {/* Контент хедера */}
        <div className="ml-5 relative flex items-end gap-8 p-8 pt-20">
          {imageUrl && (
            <div className="flex-shrink-0">
              <Image
                src={imageUrl}
                alt={name}
                width={232}
                height={232}
                className="rounded shadow-2xl"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="mb-4">
              <span className="text-sm font-semibold text-white uppercase tracking-wider">
                {type === 'playlist' ? 'Плейлист' : type === 'album' ? 'Альбом' : 'Контент'}
              </span>
            </div>
            
            <h1 className="text-6xl font-bold text-white mb-4 leading-tight">
              {name}
            </h1>
            
            <div className="flex items-center gap-2 text-neutral-300 mb-4">
              {displayName && (
                <>
                  <span className="font-semibold hover:underline cursor-pointer">
                    {displayName}
                  </span>
                  <span>•</span>
                </>
              )}
              <span>{trackCount} треков</span>
              {followers && (
                <>
                  <span>•</span>
                  <span>{followers.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} лайков</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="px-8 pb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              console.log('🔥 Play button clicked in ContentHeader', { deviceId, hasOnPlay: !!onPlay, canPlay });
              if (onPlay) onPlay();
            }}
            disabled={!canPlay}
            className={`font-bold py-4 px-8 rounded-full flex items-center gap-2 transition-all duration-200 hover:scale-105 ${
              canPlay 
                ? 'bg-green-500 hover:bg-green-600 text-black' 
                : 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <Play fill={canPlay ? "black" : "currentColor"} size={24} />
            {canPlay ? 'Воспроизвести' : (deviceId ? 'Загрузка...' : 'Подключение...')}
          </button>
          
          <button className="text-neutral-300 hover:text-white transition-colors">
            <Heart size={32} />
          </button>
          
          <button className="text-neutral-300 hover:text-white transition-colors">
            <MoreHorizontal size={32} />
          </button>
        </div>
      </div>
    </>
  );
} 