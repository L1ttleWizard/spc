import React from 'react';
import { searchSpotify } from '@/data/spotify';
import { cookies } from 'next/headers';
import LibraryProvider from '@/components/LibraryProvider';
import SearchContent from '@/components/SearchContent';



export default async function SearchPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ q?: string }> 
}) {
  const params = await searchParams;
  const q = params.q?.trim() || '';
  
  if (!q) {
    return (
      <LibraryProvider>
        <div className="p-8 text-center text-neutral-400">
          Type something to search for songs, artists, or albums.
        </div>
      </LibraryProvider>
    );
  }

  // Get access token from session cookie
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('spotify_access_token')?.value;

  let data = { tracks: [], albums: [], artists: [], playlists: [] };
  // let error = null;
  
  if (accessToken) {
    try {
      data = await searchSpotify(q, accessToken);
      console.log('🔍 Search results:', {
        tracks: data.tracks?.length || 0,
        albums: data.albums?.length || 0,
        artists: data.artists?.length || 0,
        playlists: data.playlists?.length || 0,
        sampleTrack: data.tracks?.[0],
        samplePlaylist: data.playlists?.[0]
      });
    } catch (e) {
      error = e;
      console.error('Search error:', e);
    }
  }

  return (
    <LibraryProvider>
      <SearchContent q={q} data={data} />
    </LibraryProvider>
  );
} 