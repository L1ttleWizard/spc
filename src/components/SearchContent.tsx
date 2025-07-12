"use client";

import React from 'react';
import Link from 'next/link';
import { useSpotifyPlayerContext } from './SpotifyPlayerProvider';
import { Play } from 'lucide-react';

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

interface SearchContentProps {
  q: string;
  data: {
    tracks: Track[];
    albums: any[];
    artists: any[];
    playlists: any[];
  };
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-neutral-800 animate-pulse rounded ${className}`} />;
}

function SectionSkeleton({ type }: { type: string }) {
  if (type === 'top') {
    return <Skeleton className="h-32 w-full mb-8" />;
  }
  if (type === 'songs') {
    return (
      <div className="space-y-2 mb-8">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }
  if (type === 'albums' || type === 'artists') {
    return (
      <div className="flex gap-4 mb-8">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-32" />
        ))}
      </div>
    );
  }
  return null;
}

function TopResult({ track, album, artist, onTrackClick }: any) {
  // Pick the best match: prefer artist > track > album if available
  if (artist) {
    return (
      <div className="bg-neutral-900 rounded-lg p-6 flex items-center gap-6 mb-8">
        <img src={artist.images?.[0]?.url || '/file.svg'} alt={artist.name} className="w-24 h-24 rounded-full object-cover" />
        <div>
          <div className="text-lg font-bold">{artist.name}</div>
          <div className="text-sm text-neutral-400">Artist</div>
        </div>
      </div>
    );
  }
  if (track) {
    return (
      <div 
        className="bg-neutral-900 rounded-lg p-6 flex items-center gap-6 mb-8 hover:bg-neutral-800 transition cursor-pointer group"
        onClick={() => onTrackClick && onTrackClick(track)}
      >
        <div className="relative">
          <img src={track.album?.images?.[0]?.url || '/file.svg'} alt={track.name} className="w-24 h-24 rounded object-cover" />
          {/* Play button overlay */}
          <div className="absolute inset-0 bg-black/60 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play size={24} fill="white" className="text-white" />
          </div>
        </div>
        <div>
          <div className="text-lg font-bold">{track.name}</div>
          <div className="text-sm text-neutral-400">{track.artists?.map((a: any) => a.name).join(', ')}</div>
          <div className="text-xs text-neutral-500 mt-1">Song</div>
        </div>
      </div>
    );
  }
  if (album) {
    return (
      <div className="bg-neutral-900 rounded-lg p-6 flex items-center gap-6 mb-8">
        <img src={album.images?.[0]?.url || '/file.svg'} alt={album.name} className="w-24 h-24 rounded object-cover" />
        <div>
          <div className="text-lg font-bold">{album.name}</div>
          <div className="text-sm text-neutral-400">Album</div>
          <div className="text-xs text-neutral-500 mt-1">{album.artists?.map((a: any) => a.name).join(', ')}</div>
        </div>
      </div>
    );
  }
  return null;
}

export default function SearchContent({ q, data }: SearchContentProps) {
  const { playTrack, deviceId } = useSpotifyPlayerContext();

  // Smart top result selection based on relevance
  const getTopResult = () => {
    const searchQuery = q.toLowerCase().trim();
    
    // Check for exact matches first
    const exactTrackMatch = data.tracks?.find(track => 
      track?.name?.toLowerCase() === searchQuery ||
      track?.artists?.some(artist => artist?.name?.toLowerCase() === searchQuery)
    );
    
    const exactAlbumMatch = data.albums?.find(album => 
      album?.name?.toLowerCase() === searchQuery ||
      album?.artists?.some(artist => artist?.name?.toLowerCase() === searchQuery)
    );
    
    const exactArtistMatch = data.artists?.find(artist => 
      artist?.name?.toLowerCase() === searchQuery
    );

    // If we have exact matches, prioritize them
    if (exactTrackMatch) return { type: 'track', data: exactTrackMatch };
    if (exactAlbumMatch) return { type: 'album', data: exactAlbumMatch };
    if (exactArtistMatch) return { type: 'artist', data: exactArtistMatch };

    // Check for partial matches (query contains or is contained in name)
    const partialTrackMatch = data.tracks?.find(track => 
      track?.name?.toLowerCase().includes(searchQuery) ||
      searchQuery.includes(track?.name?.toLowerCase()) ||
      track?.artists?.some(artist => 
        artist?.name?.toLowerCase().includes(searchQuery) ||
        searchQuery.includes(artist?.name?.toLowerCase())
      )
    );
    
    const partialAlbumMatch = data.albums?.find(album => 
      album?.name?.toLowerCase().includes(searchQuery) ||
      searchQuery.includes(album?.name?.toLowerCase()) ||
      album?.artists?.some(artist => 
        artist?.name?.toLowerCase().includes(searchQuery) ||
        searchQuery.includes(artist?.name?.toLowerCase())
      )
    );
    
    const partialArtistMatch = data.artists?.find(artist => 
      artist?.name?.toLowerCase().includes(searchQuery) ||
      searchQuery.includes(artist?.name?.toLowerCase())
    );

    // If we have partial matches, prioritize tracks > albums > artists
    if (partialTrackMatch) return { type: 'track', data: partialTrackMatch };
    if (partialAlbumMatch) return { type: 'album', data: partialAlbumMatch };
    if (partialArtistMatch) return { type: 'artist', data: partialArtistMatch };

    // Fallback to first available items, prioritizing tracks
    if (data.tracks?.[0]) return { type: 'track', data: data.tracks[0] };
    if (data.albums?.[0]) return { type: 'album', data: data.albums[0] };
    if (data.artists?.[0]) return { type: 'artist', data: data.artists[0] };

    return null;
  };

  const topResult = getTopResult();

  const handleTrackClick = (track: Track) => {
    console.log('🎵 SearchContent handleTrackClick:', { 
      track: { id: track.id, name: track.name, uri: track.uri }, 
      deviceId 
    });
    
    // Check if we have a device
    if (!deviceId) {
      console.error('❌ No Spotify device available for track click');
      alert('Please wait for Spotify to connect or refresh the page.');
      return;
    }

    // Check if track has a valid URI
    if (!track.uri) {
      console.error('❌ Track has no URI:', track);
      alert('This track cannot be played.');
      return;
    }
    
    // Play the track
    console.log('🎵 Playing track from search:', { trackUri: track.uri });
    playTrack(track.uri);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Search results for "{q}"</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          {/* Top result */}
          {topResult ? (
            <TopResult 
              artist={topResult.type === 'artist' ? topResult.data : null}
              track={topResult.type === 'track' ? topResult.data : null}
              album={topResult.type === 'album' ? topResult.data : null}
              onTrackClick={handleTrackClick}
            />
          ) : (
            <SectionSkeleton type="top" />
          )}
          {/* Songs */}
          <h2 className="text-xl font-semibold mb-2">Songs</h2>
          {data.tracks && data.tracks.length > 0 ? (
            <div className="space-y-2 mb-8">
              {data.tracks.filter((track: any) => track && track.id).map((track: any) => (
                <div 
                  key={track.id} 
                  className="flex items-center gap-4 bg-neutral-900 rounded p-2 hover:bg-neutral-800 transition cursor-pointer group"
                  onClick={() => handleTrackClick(track)}
                >
                  <div className="relative">
                    <img src={track?.album?.images?.[0]?.url || '/file.svg'} alt={track?.name || 'Track'} className="w-12 h-12 rounded object-cover" />
                    {/* Play button overlay */}
                    <div className="absolute inset-0 bg-black/60 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play size={16} fill="white" className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white truncate">{track?.name || 'Unknown Track'}</div>
                    <div className="text-xs text-neutral-400 truncate">{track?.artists?.map((a: any) => a?.name || 'Unknown').join(', ')}</div>
                  </div>
                  <div className="text-xs text-neutral-500">{Math.floor((track?.duration_ms || 0) / 60000)}:{((Math.floor((track?.duration_ms || 0) / 1000) % 60)).toString().padStart(2, '0')}</div>
                </div>
              ))}
            </div>
          ) : (
            <SectionSkeleton type="songs" />
          )}
        </div>
        <div>
          {/* Featuring (albums) */}
          <h2 className="text-xl font-semibold mb-2">Featuring</h2>
          {data.albums && data.albums.length > 0 ? (
            <div className="flex gap-4 mb-8 overflow-x-auto">
              {data.albums.filter((album: any) => album && album.id).slice(0, 4).map((album: any) => (
                <Link key={album.id} href={`/album/${album.id}`} className="w-32 flex-shrink-0 bg-neutral-900 rounded-lg p-2 hover:bg-neutral-800 transition cursor-pointer group">
                  <div className="relative">
                    <img src={album?.images?.[0]?.url || '/file.svg'} alt={album?.name || 'Album'} className="w-full h-24 rounded object-cover mb-2" />
                    {/* Play button overlay */}
                    <div className="absolute inset-0 bg-black/60 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play size={16} fill="white" className="text-white" />
                    </div>
                  </div>
                  <div className="font-medium text-white truncate">{album?.name || 'Unknown Album'}</div>
                  <div className="text-xs text-neutral-400 truncate">{album?.artists?.map((a: any) => a?.name || 'Unknown').join(', ')}</div>
                </Link>
              ))}
            </div>
          ) : (
            <SectionSkeleton type="albums" />
          )}
          {/* Artists */}
          <h2 className="text-xl font-semibold mb-2">Artists</h2>
          {data.artists && data.artists.length > 0 ? (
            <div className="flex gap-4 mb-8 overflow-x-auto">
              {data.artists.filter((artist: any) => artist && artist.id).map((artist: any) => (
                <div key={artist.id} className="w-32 flex-shrink-0 flex flex-col items-center bg-neutral-900 rounded-lg p-2 hover:bg-neutral-800 transition">
                  <img src={artist?.images?.[0]?.url || '/file.svg'} alt={artist?.name || 'Artist'} className="w-24 h-24 rounded-full object-cover mb-2" />
                  <div className="font-medium text-white truncate text-center">{artist?.name || 'Unknown Artist'}</div>
                  <div className="text-xs text-neutral-400 truncate">Artist</div>
                </div>
              ))}
            </div>
          ) : (
            <SectionSkeleton type="artists" />
          )}
          {/* Albums */}
          <h2 className="text-xl font-semibold mb-2">Albums</h2>
          {data.albums && data.albums.length > 0 ? (
            <div className="flex gap-4 mb-8 overflow-x-auto">
              {data.albums.filter((album: any) => album && album.id).slice(4).map((album: any) => (
                <Link key={album.id} href={`/album/${album.id}`} className="w-32 flex-shrink-0 bg-neutral-900 rounded-lg p-2 hover:bg-neutral-800 transition cursor-pointer group">
                  <div className="relative">
                    <img src={album?.images?.[0]?.url || '/file.svg'} alt={album?.name || 'Album'} className="w-full h-24 rounded object-cover mb-2" />
                    {/* Play button overlay */}
                    <div className="absolute inset-0 bg-black/60 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play size={16} fill="white" className="text-white" />
                    </div>
                  </div>
                  <div className="font-medium text-white truncate">{album?.name || 'Unknown Album'}</div>
                  <div className="text-xs text-neutral-400 truncate">{album?.artists?.map((a: any) => a?.name || 'Unknown').join(', ')}</div>
                </Link>
              ))}
            </div>
          ) : (
            <SectionSkeleton type="albums" />
          )}
        </div>
      </div>
    </div>
  );
} 