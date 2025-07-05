"use client";

import React from 'react';
import ContentHeader from './ContentHeader';
import TrackList from './TrackList';
import { useSpotifyPlayerContext } from './SpotifyPlayerProvider';

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

interface ContentPageClientProps {
  type: 'playlist' | 'album';
  name: string;
  imageUrl?: string;
  owner?: string;
  artist?: string;
  trackCount: number;
  followers?: number;
  tracks: Track[];
  playlistUri?: string;
}

export default function ContentPageClient({
  type,
  name,
  imageUrl,
  owner,
  artist,
  trackCount,
  followers,
  tracks,
  playlistUri
}: ContentPageClientProps) {
  const { playTrack, playPlaylist, deviceId } = useSpotifyPlayerContext();

  const handlePlayAll = () => {
    console.log('🎵 handlePlayAll called:', { 
      type, 
      name, 
      tracksLength: tracks.length, 
      playlistUri, 
      deviceId,
      firstTrack: tracks[0] ? {
        id: tracks[0].id,
        name: tracks[0].name,
        uri: tracks[0].uri
      } : null
    });
    
    // Check if we have a device
    if (!deviceId) {
      console.error('❌ No Spotify device available. Make sure the Web Player is loaded.');
      return;
    }
    
    // For playlists (except Liked Songs), play the whole playlist
    if (type === 'playlist' && playlistUri && name !== 'Liked Songs') {
      console.log('🎵 Playing playlist:', playlistUri);
      playPlaylist(playlistUri);
    } else if (tracks.length > 0 && tracks[0]?.uri) {
      // For albums and Liked Songs, play the first track
      console.log('🎵 Playing first track:', tracks[0].uri);
      playTrack(tracks[0].uri);
    } else {
      console.warn('⚠️ No valid tracks to play:', { 
        tracksLength: tracks.length, 
        firstTrackUri: tracks[0]?.uri,
        sampleTracks: tracks.slice(0, 3).map(t => ({ id: t.id, name: t.name, uri: t.uri }))
      });
    }
  };

  const handleTrackClick = (track: Track, index: number) => {
    console.log('handleTrackClick called:', { track: track.name, index, trackUri: track.uri, deviceId });
    
    // Для "Мои любимые" воспроизводим треки по отдельности
    if (type === 'playlist' && playlistUri && name !== 'Liked Songs') {
      // Для обычных плейлистов играем с определенной позиции
      console.log('Playing playlist from position:', index);
      playPlaylist(playlistUri, index);
    } else if (track.uri) {
      // Для альбомов и "Мои любимые" играем конкретный трек
      console.log('Playing track:', track.uri);
      playTrack(track.uri);
    } else {
      console.warn('Track has no URI:', track);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 via-neutral-900 to-black">
      <ContentHeader
        type={type}
        name={name}
        imageUrl={imageUrl}
        owner={owner}
        artist={artist}
        trackCount={trackCount}
        followers={followers}
        onPlay={handlePlayAll}
        deviceId={deviceId}
      />

      {/* Список треков */}
      <div className="px-8 pb-8">
        <TrackList 
          tracks={tracks}
          onTrackClick={handleTrackClick}
        />
      </div>
    </div>
  );
} 