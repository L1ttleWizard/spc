"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export interface PlaylistCardProps {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  id: string;
}

export default function PlaylistCard({ name, description, imageUrl, id }: PlaylistCardProps) {
  const handleClick = () => {
  };

  return (
    <Link href={`/playlist/${id}`} className="block" onClick={handleClick}>
      <div className="bg-neutral-800/50 hover:bg-neutral-800/70 rounded-lg p-4 transition-colors cursor-pointer group">
        <div className="aspect-square mb-4 relative">
          {imageUrl ? (
            <Image 
              src={imageUrl} 
              alt={name}
              className="w-full h-full object-cover rounded-md"
              width={300}
              height={300}
              priority
              loading="eager"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 rounded-md flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{name.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
        <h3 className="font-semibold truncate mb-1 group-hover:underline">{name}</h3>
        {description && <p className="text-xs text-neutral-400 truncate">{description}</p>}
      </div>
    </Link>
  );
}