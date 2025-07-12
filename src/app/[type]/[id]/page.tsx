import { getPlaylistById, getAlbumById } from '@/data/spotify';
import { notFound } from 'next/navigation';
import ContentPageClient from '@/components/ContentPageClient';
import LibraryProvider from '@/components/LibraryProvider';
import { cookies } from 'next/headers';
import { Playlist, Album, Track } from '../../types/spotify';

interface ContentPageProps {
  params: Promise<{ type: string; id: string }>;
}

export default async function ContentPage({ params }: ContentPageProps) {
  const { type, id } = await params;
  
  // Проверяем авторизацию
  const cookieStore = await cookies();
  const hasToken = cookieStore.has('spotify_access_token');
  
  if (!hasToken) {
    return notFound();
  }
  
  let content: Playlist | Album | null = null;
  
  // В зависимости от типа загружаем разные данные
  if (type === 'playlist') {
    content = await getPlaylistById(id);
  } else if (type === 'album') {
    content = await getAlbumById(id);
  }
  
  if (!content) return notFound();

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
        trackCount={validTracks.length}
        followers={isPlaylist(content) ? content.followers?.total : undefined}
        tracks={validTracks}
        playlistUri={playlistUri}
      />
    </LibraryProvider>
  );
}