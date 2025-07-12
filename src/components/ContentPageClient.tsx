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
  imageUrl?: string | undefined;
  owner?: string | undefined;
  artist?: string | undefined;
  trackCount: number;
  followers?: number | undefined;
  tracks: Track[];
  playlistUri?: string | undefined;
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
    console.log('🎵 handlePlayAll called:', { type, name, playlistUri, deviceId, tracksCount: tracks.length });
    
    // Check if we have a device
    if (!deviceId) {
      console.error('❌ No Spotify device available. Make sure the Web Player is loaded.');
      alert('Please wait for Spotify to connect or refresh the page.');
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
      alert('No tracks available to play.');
    }
  };

  const handleTrackClick = (track: Track, index: number) => {
    console.log('🎵 ContentPageClient handleTrackClick:', { 
      track: { id: track.id, name: track.name, uri: track.uri }, 
      index, 
      type, 
      name, 
      playlistUri, 
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
    
    // Для "Мои любимые" воспроизводим треки по отдельности
    if (type === 'playlist' && playlistUri && name !== 'Liked Songs') {
      // Для обычных плейлистов играем с определенной позиции
      console.log('🎵 Playing playlist from position:', { playlistUri, index });
      playPlaylist(playlistUri, index);
    } else if (track.uri) {
      // Для альбомов и "Мои любимые" играем конкретный трек
      console.log('🎵 Playing track:', { trackUri: track.uri });
      playTrack(track.uri);
    } else {
      console.warn('Track has no URI:', track);
      alert('This track cannot be played.');
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