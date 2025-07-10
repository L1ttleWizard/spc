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
}: ContentPageClientProps): JSX.Element {
  const { playTrack, playPlaylist, deviceId } = useSpotifyPlayerContext();

  const handlePlayAll = () => {
    
    // Check if we have a device
    if (!deviceId) {
      console.error('❌ No Spotify device available. Make sure the Web Player is loaded.');
      return;
    }
    
    // For playlists (except Liked Songs), play the whole playlist
    if (type === 'playlist' && playlistUri && name !== 'Liked Songs') {
      playPlaylist(playlistUri);
    } else if (tracks.length > 0 && tracks[0]?.uri) {
      // For albums and Liked Songs, play the first track
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
    
    // Для "Мои любимые" воспроизводим треки по отдельности
    if (type === 'playlist' && playlistUri && name !== 'Liked Songs') {
      // Для обычных плейлистов играем с определенной позиции
      playPlaylist(playlistUri, index);
    } else if (track.uri) {
      // Для альбомов и "Мои любимые" играем конкретный трек
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