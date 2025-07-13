import { getPlaylistById, getAlbumById, getArtistById, getArtistTopTracks, getArtistAlbums, getRelatedArtists } from '@/data/spotify';
import { notFound } from 'next/navigation';
import ContentPageClient from '@/components/ContentPageClient';
import LibraryProvider from '@/components/LibraryProvider';
import LikedSongsPageClient from '@/components/LikedSongsPageClient';
import ArtistPageClient from '@/components/ArtistPageClient';
import { cookies } from 'next/headers';
import { Playlist, Album, Track } from '../../types/spotify';

interface ContentPageProps {
  params: Promise<{ type: string; id: string }>;
}

export default async function ContentPage({ params }: ContentPageProps) {
  const { type, id } = await params;
  
  console.log('🎵 ContentPage accessed:', { type, id });
  
  // Проверяем авторизацию
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('spotify_access_token');
  const hasToken = !!accessToken?.value;
  
  console.log('🔑 Authentication check:', { hasToken, tokenLength: accessToken?.value?.length || 0 });
  
  if (!hasToken) {
    console.log('❌ No access token found, redirecting to login');
    // Instead of returning notFound(), we should redirect to login
    // But since this is a server component, we'll throw an error that will be caught by the error boundary
    throw new Error('authentication_required');
  }
  
  let content: Playlist | Album | null = null;
  
  // В зависимости от типа загружаем разные данные
  if (type === 'playlist') {
    console.log('📋 Processing playlist type:', { id });
    
    if (id === 'liked-songs') {
      console.log('❤️ Processing Liked Songs playlist');
      
      // For liked songs, we'll use the client component with lazy loading
      // This allows for immediate access and progressive loading
      return (
        <LibraryProvider>
          <LikedSongsPageClient initialData={null} />
        </LibraryProvider>
      );
    } else {
      console.log('📋 Fetching regular playlist:', { id });
      content = await getPlaylistById(id);
      console.log('📊 Regular playlist result:', { success: !!content });
    }
  } else if (type === 'album') {
    console.log('💿 Processing album type:', { id });
    content = await getAlbumById(id);
  } else if (type === 'artist') {
    console.log('🎤 Processing artist type:', { id });
    
    // For artists, we need to fetch multiple pieces of data
    const [artist, topTracks, albums, relatedArtists] = await Promise.allSettled([
      getArtistById(id),
      getArtistTopTracks(id),
      getArtistAlbums(id),
      getRelatedArtists(id)
    ]);
    
    const artistData = artist.status === 'fulfilled' ? artist.value : null;
    const topTracksData = topTracks.status === 'fulfilled' ? topTracks.value : null;
    const albumsData = albums.status === 'fulfilled' ? albums.value : null;
    const relatedArtistsData = relatedArtists.status === 'fulfilled' ? relatedArtists.value : null;
    
    if (!artistData) {
      console.log('❌ No artist data found, returning notFound()');
      return notFound();
    }
    
    console.log('📊 Artist data result:', { 
      success: !!artistData, 
      name: artistData.name,
      hasTopTracks: !!topTracksData,
      topTracksCount: topTracksData?.tracks?.length || 0,
      hasAlbums: !!albumsData,
      albumsCount: albumsData?.items?.length || 0,
      hasRelatedArtists: !!relatedArtistsData,
      relatedArtistsCount: relatedArtistsData?.artists?.length || 0,
      relatedArtistsType: typeof relatedArtistsData,
      relatedArtistsIsArray: Array.isArray(relatedArtistsData?.artists)
    });
    
    return (
      <LibraryProvider>
        <ArtistPageClient
          artist={artistData}
          topTracks={topTracksData}
          albums={albumsData}
          relatedArtists={relatedArtistsData}
        />
      </LibraryProvider>
    );
  }
  
  console.log('📄 Final content result:', { 
    success: !!content, 
    type: content?.name,
    trackCount: content?.tracks?.items?.length 
  });
  
  if (!content) {
    console.log('❌ No content found, returning notFound()');
    return notFound();
  }

  // Filter and transform tracks to ensure proper format
  let validTracks: Track[] = [];
  
  if (type === 'playlist') {
    // For playlists, tracks are in tracks.items[].track
    validTracks = (content as Playlist).tracks?.items
      ?.filter((item: { track: Track | null }) => {
        if (!item || !item.track) return false;
        const track = item.track;
        return track.id && track.name && track.artists;
      })
      ?.map((item: { track: Track }) => {
        const track = item.track;
        return {
          ...track,
          uri: track.uri || `spotify:track:${track.id}`, // Ensure URI exists
          album: track.album || { name: 'Unknown Album', images: [] },
          artists: track.artists.map(artist => ({
            id: artist.id,
            name: artist.name
          }))
        };
      }) || [];
  } else if (type === 'album') {
    // For albums, tracks are in tracks.items directly
    validTracks = (content as Album).tracks?.items
      ?.filter((track: Track) => {
        if (!track) return false;
        return track.id && track.name && track.artists;
      })
      ?.map((track: Track) => {
        return {
          ...track,
          uri: track.uri || `spotify:track:${track.id}`, // Ensure URI exists
          album: content as Album, // Use album data for album tracks
          artists: track.artists.map(artist => ({
            id: artist.id,
            name: artist.name
          }))
        };
      }) || [];
  }

  // Создаем URI для плейлиста
  let playlistUri: string | undefined;
  if (type === 'playlist' && id !== 'liked-songs') {
    playlistUri = `spotify:playlist:${id}`;
  }



  // Type guards for Playlist and Album
  function isPlaylist(obj: Playlist | Album): obj is Playlist {
    return obj && typeof obj === 'object' && 'owner' in obj && 'followers' in obj;
  }
  function isAlbum(obj: Playlist | Album): obj is Album {
    return obj && typeof obj === 'object' && 'artists' in obj;
  }

  return (
    <LibraryProvider>
      <ContentPageClient
        type={type as 'playlist' | 'album'}
        name={content.name}
        imageUrl={content.images?.[0]?.url}
        owner={isPlaylist(content) ? content.owner?.display_name : undefined}
        artist={isAlbum(content) ? content.artists?.[0]?.name : undefined}
        artistId={isAlbum(content) ? content.artists?.[0]?.id : undefined}
        trackCount={validTracks.length}
        followers={isPlaylist(content) ? content.followers?.total : undefined}
        tracks={validTracks}
        playlistUri={playlistUri}
      />
    </LibraryProvider>
  );
}