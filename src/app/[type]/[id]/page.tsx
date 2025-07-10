import { cookies } from 'next/headers';
import { getPlaylistById, getAlbumById, getLibraryData } from '@/data/spotify';
import { notFound } from 'next/navigation';
import ContentPageClient from '@/components/ContentPageClient';
import AppLayout from '@/components/AppLayout';

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
  
  let content = null;
  
  // В зависимости от типа загружаем разные данные
  if (type === 'playlist') {
    content = await getPlaylistById(id);
  } else if (type === 'album') {
    content = await getAlbumById(id);
  }
  
  if (!content) return notFound();

  // Filter and transform tracks to ensure proper format
  let validTracks: any[] = [];
  
  if (type === 'playlist') {
    // For playlists, tracks are in tracks.items[].track
    validTracks = content.tracks?.items
      ?.filter((item: any) => {
        if (!item || !item.track) return false;
        const track = item.track;
        return track.id && track.name && track.artists;
      })
      ?.map((item: any) => {
        const track = item.track;
        return {
          ...track,
          uri: track.uri || `spotify:track:${track.id}`, // Ensure URI exists
          album: track.album || { name: 'Unknown Album', images: [] },
        };
      }) || [];
  } else if (type === 'album') {
    // For albums, tracks are in tracks.items directly
    validTracks = content.tracks?.items
      ?.filter((track: any) => {
        if (!track) return false;
        return track.id && track.name && track.artists;
      })
      ?.map((track: any) => {
        return {
          ...track,
          uri: track.uri || `spotify:track:${track.id}`, // Ensure URI exists
          album: content, // Use album data for album tracks
        };
      }) || [];
  }

  // Создаем URI для плейлиста
  let playlistUri: string | undefined;
  if (type === 'playlist' && id !== 'liked-songs') {
    playlistUri = `spotify:playlist:${id}`;
  }

  // Загружаем данные сайдбара
  const sidebarData = await getLibraryData();

  // Type guards for Playlist and Album
  function isPlaylist(obj: any): obj is { owner?: { display_name?: string }, followers?: { total?: number } } {
    return obj && typeof obj === 'object' && 'owner' in obj && 'followers' in obj;
  }
  function isAlbum(obj: any): obj is { artists?: { name?: string }[] } {
    return obj && typeof obj === 'object' && 'artists' in obj;
  }

  return (
    <AppLayout sidebarItems={sidebarData}>
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
    </AppLayout>
  );
} 