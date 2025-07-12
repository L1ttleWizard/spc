"use client";

import React from 'react';
import { Heart } from 'lucide-react';
import { useLikeTrack } from '@/hooks/useLikeTrack';

interface LikeButtonProps {
  trackId: string;
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function LikeButton({ 
  trackId, 
  className = "", 
  size = 20,
  showText = false 
}: LikeButtonProps) {
  const { isLiked, toggleLike } = useLikeTrack();
  const liked = isLiked(trackId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike(trackId);
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center space-x-2 transition-all duration-200 hover:scale-105 ${
        liked 
          ? 'text-green-500 hover:text-green-400' 
          : 'text-neutral-400 hover:text-white'
      } ${className}`}
      aria-label={liked ? 'Unlike track' : 'Like track'}
    >
      <Heart 
        size={size} 
        className={`transition-all duration-200 ${
          liked ? 'fill-current' : 'fill-none'
        }`}
      />
      {showText && (
        <span className="text-sm font-medium">
          {liked ? 'Liked' : 'Like'}
        </span>
      )}
    </button>
  );
} 