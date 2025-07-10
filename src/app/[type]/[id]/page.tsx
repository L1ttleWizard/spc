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

  return (
    <AppLayout sidebarItems={sidebarData}>
      <ContentPageClient
        type={type as 'playlist' | 'album'}
        name={content.name}
        imageUrl={content.images?.[0]?.url}
        owner={content.owner?.display_name}
        artist={content.artists?.[0]?.name}
        trackCount={validTracks.length}
        followers={content.followers?.total}
        tracks={validTracks}
        playlistUri={playlistUri}
      />
    </AppLayout>
  );
} 