'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface ArtistCardProps {
  id: string;
  name: string;
  imageUrl?: string | null;
  followers?: number;
  genres?: string[];
  popularity?: number;
  showDetails?: boolean;
}

export default function ArtistCard({ 
  id, 
  name, 
  imageUrl, 
  followers, 
  genres, 
  popularity, 
  showDetails = false 
}: ArtistCardProps) {
  const formatFollowers = (count?: number) => {
    if (!count) return '';
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M followers`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K followers`;
    }
    return `${count} followers`;
  };

  const CardContent = () => (
    <div className="bg-neutral-800/50 hover:bg-neutral-800/70 rounded-lg p-4 transition-colors cursor-pointer group">
      <div className="aspect-square mb-4 relative">
        {imageUrl ? (
          <Image 
            src={imageUrl} 
            alt={name}
            className="w-full h-full object-cover rounded-full"
            width={300}
            height={300}
            priority
            loading="eager"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">{name.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
      <h3 className="font-semibold truncate mb-1 group-hover:underline">{name}</h3>
      <p className="text-sm text-neutral-400 truncate">Artist</p>
      
      {showDetails && (
        <div className="mt-2 space-y-1">
          {followers && (
            <p className="text-xs text-neutral-500">{formatFollowers(followers)}</p>
          )}
          {genres && genres.length > 0 && (
            <p className="text-xs text-neutral-500 truncate">{genres.slice(0, 2).join(', ')}</p>
          )}
          {popularity && (
            <div className="flex items-center gap-1">
              <div className="flex-1 bg-neutral-700 rounded-full h-1">
                <div 
                  className="bg-green-500 h-1 rounded-full"
                  style={{ width: `${popularity}%` }}
                />
              </div>
              <span className="text-xs text-neutral-500">{popularity}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Link href={`/artist/${id}`}>
      <CardContent />
    </Link>
  );
} 