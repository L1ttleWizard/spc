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
  console.log('Loading content with type:', type, 'ID:', id);
  
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
  
  console.log('Content data:', content ? 'Found' : 'Not found');
  
  if (!content) return notFound();

  // Фильтруем null треки и преобразуем в нужный формат
  let validTracks: any[] = [];
  
  if (type === 'playlist') {
    // Для плейлистов треки находятся в tracks.items[].track
    validTracks = content.tracks?.items
      ?.filter((item: any) => {
        // Проверяем, что трек существует и имеет необходимые поля
        if (!item || !item.track) return false;
        const track = item.track;
        return track.id && track.name && track.uri && track.artists && track.album;
      })
      ?.map((item: any) => item.track) || [];
  } else if (type === 'album') {
    // Для альбомов треки находятся в tracks.items напрямую
    validTracks = content.tracks?.items
      ?.filter((track: any) => {
        // Проверяем, что трек существует и имеет необходимые поля
        if (!track) return false;
        return track.id && track.name && track.uri && track.artists && track.album;
      }) || [];
  }

  console.log(`Filtered tracks: ${validTracks.length} valid tracks out of ${content.tracks?.items?.length || 0} total`);

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