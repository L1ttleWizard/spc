"use client";

import React from 'react';
import { Play } from 'lucide-react';

interface PlayButtonProps {
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function PlayButton({ onClick, size = 'md', className = '' }: PlayButtonProps) {
  const sizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 24
  };

  return (
    <button
      onClick={(e) => {
        console.log('🎵 PlayButton clicked', { size, hasOnClick: !!onClick });
        if (onClick) {
          onClick(e);
        }
      }}
      className={`bg-white text-black rounded-full hover:scale-110 transition-transform ${sizeClasses[size]} ${className}`}
      aria-label="Воспроизвести"
    >
      <Play fill="black" size={iconSizes[size]} />
    </button>
  );
} 