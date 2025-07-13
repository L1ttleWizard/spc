"use client";

import React from 'react';
import Link from 'next/link';

interface Artist {
  id: string;
  name: string;
}

interface ArtistLinkProps {
  artist: Artist;
  className?: string;
  children?: React.ReactNode;
}

const ArtistLink: React.FC<ArtistLinkProps> = ({ artist, className = "", children }) => {
  return (
    <Link
      href={`/artist/${artist.id}`}
      className={`hover:underline hover:text-white transition-colors ${className}`}
      onClick={(e) => {
        // Prevent event bubbling to avoid triggering parent click handlers
        e.stopPropagation();
      }}
    >
      {children || artist.name}
    </Link>
  );
};

export default ArtistLink; 