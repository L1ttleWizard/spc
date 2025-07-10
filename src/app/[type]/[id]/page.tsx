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
  const cookieStore = await cookies();
  const hasToken = cookieStore.has('spotify_access_token');
  if (!hasToken) return notFound();

  // Liked Songs pseudo-playlist is not a true PlaylistObjectFull, so allow for its shape
  type LikedSongsPlaylist = {
    id: string;
    name: string;
    description: string;
    images: { url: string }[];
    owner: { display_name: string };
    followers: { total: number };
    tracks: { items: { track: SpotifyApi.TrackObjectFull }[] };
  };

  let content: SpotifyApi.PlaylistObjectFull | SpotifyApi.AlbumObjectFull | LikedSongsPlaylist | null = null;
  if (type === 'playlist') {
    content = await getPlaylistById(id);
  } else if (type === 'album') {
    content = await getAlbumById(id);
  }
  if (!content) return notFound();

  let validTracks: SpotifyApi.TrackObjectFull[] = [];
  if (type === 'playlist') {
    // Handle both PlaylistObjectFull and LikedSongsPlaylist
    const playlistContent = content as SpotifyApi.PlaylistObjectFull | LikedSongsPlaylist;
    validTracks = playlistContent.tracks?.items
      ?.filter((item: { track: SpotifyApi.TrackObjectFull | null }) => {
        return !!item && !!item.track && item.track.id && item.track.name && item.track.artists;
      })
      ?.map((item: { track: SpotifyApi.TrackObjectFull | null }) => {
        const track = item.track!;
        return {
          ...track,
          uri: track.uri || `spotify:track:${track.id}`,
          album: track.album || { name: 'Unknown Album', images: [] },
        };
      }) || [];
  } else if (type === 'album') {
    const albumContent = content as SpotifyApi.AlbumObjectFull;
    validTracks = albumContent.tracks?.items
      ?.filter((track: SpotifyApi.TrackObjectSimplified) => {
        if (!track) return false;
        return track.id && track.name && track.artists;
      })
      ?.map((track: SpotifyApi.TrackObjectSimplified) => {
        // Convert TrackObjectSimplified to TrackObjectFull shape for downstream compatibility
        return {
          ...track,
          uri: track.uri || `spotify:track:${track.id}`,
          album: albumContent,
          external_ids: {},
          popularity: 0,
        } as SpotifyApi.TrackObjectFull;
      }) || [];
  }

  let playlistUri: string | undefined;
  if (type === 'playlist' && id !== 'liked-songs') {
    playlistUri = `spotify:playlist:${id}`;
  }

  const sidebarData = await getLibraryData();

  function isPlaylist(obj: unknown): obj is SpotifyApi.PlaylistObjectFull | LikedSongsPlaylist {
    return obj && typeof obj === 'object' && 'owner' in obj && 'followers' in obj;
  }
  function isAlbum(obj: unknown): obj is SpotifyApi.AlbumObjectFull {
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