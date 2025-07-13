'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Play, Heart, MoreHorizontal, Users, Music } from 'lucide-react';
import { useSpotifyPlayerContext } from './SpotifyPlayerProvider';
import TrackList from './TrackList';
import AlbumCard from './AlbumCard';
import ArtistCard from './ArtistCard';
import { SpotifyApi } from '@/types/spotify';

interface ArtistPageClientProps {
  artist: SpotifyApi.SingleArtistResponse;
  topTracks: SpotifyApi.ArtistsTopTracksResponse | null;
  albums: SpotifyApi.ArtistsAlbumsResponse | null;
  relatedArtists: SpotifyApi.ArtistsRelatedArtistsResponse | null;
}

export default function ArtistPageClient({ 
  artist, 
  topTracks, 
  albums, 
  relatedArtists 
}: ArtistPageClientProps) {
  // Debug logging
  console.log('🎤 ArtistPageClient received data:', {
    artistName: artist?.name,
    hasTopTracks: !!topTracks,
    topTracksCount: topTracks?.tracks?.length || 0,
    hasAlbums: !!albums,
    albumsCount: albums?.items?.length || 0,
    hasRelatedArtists: !!relatedArtists,
    relatedArtistsCount: relatedArtists?.artists?.length || 0,
    relatedArtistsType: typeof relatedArtists,
    relatedArtistsIsArray: Array.isArray(relatedArtists?.artists)
  });
  const { playTrack, playPlaylist } = useSpotifyPlayerContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'albums' | 'related'>('overview');

  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M followers`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K followers`;
    }
    return `${count} followers`;
  };

  const handlePlayArtist = () => {
    if (topTracks && topTracks.tracks.length > 0) {
      // Play the first top track
      const firstTrack = topTracks.tracks[0];
      playTrack(firstTrack.uri);
    }
  };

  const handlePlayTopTracks = () => {
    if (topTracks && topTracks.tracks.length > 0) {
      // Create a virtual playlist from top tracks
      const trackUris = topTracks.tracks.map(track => track.uri);
      // For now, just play the first track
      playTrack(trackUris[0]);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Music },
    { id: 'albums', label: 'Albums', icon: Music },
    { id: 'related', label: 'Related Artists', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 to-black text-white">
      {/* Hero Section */}
      <div className="relative h-96">
        {/* Background Image */}
        <div className="absolute inset-0">
          {artist.images && artist.images.length > 0 ? (
            <Image
              src={artist.images[0].url}
              alt={artist.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600" />
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative h-full flex items-end p-8">
          <div className="flex items-end gap-6">
            {/* Artist Image */}
            <div className="w-48 h-48 rounded-full overflow-hidden shadow-2xl">
              {artist.images && artist.images.length > 0 ? (
                <Image
                  src={artist.images[0].url}
                  alt={artist.name}
                  width={192}
                  height={192}
                  className="w-full h-full object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <span className="text-white text-4xl font-bold">{artist.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* Artist Info */}
            <div className="flex-1">
              <h1 className="text-6xl font-bold mb-4">{artist.name}</h1>
              <div className="flex items-center gap-6 text-sm text-neutral-300">
                {artist.followers && (
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span>{formatFollowers(artist.followers.total)}</span>
                  </div>
                )}
                {artist.genres && artist.genres.length > 0 && (
                  <span>{artist.genres.slice(0, 3).join(', ')}</span>
                )}
                {artist.popularity && (
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-neutral-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${artist.popularity}%` }}
                      />
                    </div>
                    <span>{artist.popularity}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={handlePlayArtist}
                className="bg-green-500 hover:bg-green-600 text-black px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2"
              >
                <Play size={20} fill="black" />
                Play
              </button>
              <button className="p-3 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors">
                <Heart size={20} />
              </button>
              <button className="p-3 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-8">
        {/* Tabs */}
        <div className="flex gap-8 mb-8 border-b border-neutral-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-4 px-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Popular Tracks */}
            {topTracks && topTracks.tracks.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Popular Tracks</h2>
                  <button
                    onClick={handlePlayTopTracks}
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    Play all
                  </button>
                </div>
                <div className="bg-neutral-900/50 rounded-lg p-4">
                  <TrackList 
                    tracks={topTracks.tracks.slice(0, 5).map(track => ({
                      id: track.id,
                      name: track.name,
                      duration_ms: track.duration_ms,
                      artists: track.artists,
                      album: track.album,
                      uri: track.uri
                    }))}
                    onTrackClick={(track) => playTrack(track.uri!)}
                  />
                </div>
              </div>
            )}

            {/* Recent Albums */}
            {albums && albums.items.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Recent Albums</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {albums.items.slice(0, 6).map((album) => (
                    <AlbumCard
                      key={album.id}
                      id={album.id}
                      name={album.name}
                      artist={artist.name}
                      artistId={artist.id}
                      imageUrl={album.images?.[0]?.url}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Related Artists */}
            {relatedArtists && relatedArtists.artists.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Fans Also Like</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {relatedArtists.artists.slice(0, 6).map((relatedArtist) => (
                    <ArtistCard
                      key={relatedArtist.id}
                      id={relatedArtist.id}
                      name={relatedArtist.name}
                      imageUrl={relatedArtist.images?.[0]?.url}
                      followers={relatedArtist.followers?.total}
                      genres={relatedArtist.genres}
                      popularity={relatedArtist.popularity}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'albums' && albums && (
          <div>
            <h2 className="text-2xl font-bold mb-4">All Albums</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {albums.items.map((album) => (
                <AlbumCard
                  key={album.id}
                  id={album.id}
                  name={album.name}
                  artist={artist.name}
                  artistId={artist.id}
                  imageUrl={album.images?.[0]?.url}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'related' && relatedArtists && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Related Artists</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {relatedArtists.artists.map((relatedArtist) => (
                <ArtistCard
                  key={relatedArtist.id}
                  id={relatedArtist.id}
                  name={relatedArtist.name}
                  imageUrl={relatedArtist.images?.[0]?.url}
                  followers={relatedArtist.followers?.total}
                  genres={relatedArtist.genres}
                  popularity={relatedArtist.popularity}
                  showDetails={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 