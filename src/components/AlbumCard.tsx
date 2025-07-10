"use client";

import React from 'react';
import Link from 'next/link';

interface AlbumCardProps {
  name: string;
  artist: string;
  imageUrl?: string | null;
  id?: string;
}

export default function AlbumCard({ name, artist, imageUrl, id }: AlbumCardProps) {
  const CardContent = () => (
    <div className="bg-neutral-800/50 hover:bg-neutral-800/70 rounded-lg p-4 transition-colors cursor-pointer group">
      <div className="aspect-square mb-4 relative">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={name}
            className="w-full h-full object-cover rounded-md"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-600 to-teal-600 rounded-md flex items-center justify-center">
            <span className="text-white text-2xl font-bold">{name.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
      <h3 className="font-semibold truncate mb-1 group-hover:underline">{name}</h3>
      <p className="text-sm text-neutral-400 truncate">{artist}</p>
    </div>
  );

  if (id) {
    return (
      <Link href={`/album/${id}`}>
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
} 