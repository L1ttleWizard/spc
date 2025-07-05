import { getSpotifyServerApi } from '@/lib/spotify-server';
import { LibraryItem, LibrarySortType, LibraryFilterType } from '@/types';

// Кэш для хранения данных
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

// Функция для получения кэшированных данных
function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

// Функция для сохранения данных в кэш
function setCachedData<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

function isFulfilled<T>(p: PromiseSettledResult<T>): p is PromiseFulfilledResult<T> {
  return p.status === 'fulfilled';
}

export async function getLibraryData(
  sort?: LibrarySortType,
  filter?: LibraryFilterType
): Promise<LibraryItem[] | null> {
  const cacheKey = `library_${sort}_${filter}`;
  const cached = getCachedData<LibraryItem[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const spotifyApi = await getSpotifyServerApi();
    
    // Ограничиваем количество запросов для ускорения
    const [
      playlistsResult,
      albumsResult,
      recentlyPlayedResult,
    ] = await Promise.allSettled([
      spotifyApi.getUserPlaylists({ limit: 30 }),
      spotifyApi.getMySavedAlbums({ limit: 30 }),
      spotifyApi.getMyRecentlyPlayedTracks({ limit: 20 })
    ]);

    // Получаем только первые 100 лайкнутых треков для ускорения
    const likedTracksResult = await spotifyApi.getMySavedTracks({ limit: 50 });
    const allLikedTracks = likedTracksResult.body.items.slice(0, 100);

    const lastPlayedMap = new Map<string, Date>();
    const likedSongsTrackIds = new Set<string>();

    // Добавляем ID всех лайкнутых треков
    allLikedTracks.forEach(item => likedSongsTrackIds.add(item.track.id));

    if (isFulfilled(recentlyPlayedResult)) {
      recentlyPlayedResult.value.body.items.forEach(item => {
        if (likedSongsTrackIds.has(item.track.id)) {
            const existingDate = lastPlayedMap.get('liked-songs');
            const newDate = new Date(item.played_at);
            if (!existingDate || newDate > existingDate) {
                lastPlayedMap.set('liked-songs', newDate);
            }
        }
        if (item.context?.uri) {
          const contextId = item.context.uri.split(':').pop();
          if (contextId && !lastPlayedMap.has(contextId)) {
            lastPlayedMap.set(contextId, new Date(item.played_at));
          }
        }
      });
    }

    let libraryItems: LibraryItem[] = [];

    // Добавляем Liked Songs
      libraryItems.push({
        id: 'liked-songs', type: 'playlist', name: 'Liked Songs',
        imageUrl: 'https://misc.scdn.co/liked-songs/liked-songs-300.png',
      subtitle: `Playlist • ${allLikedTracks.length} songs`,
        creator: 'You',
        dateAdded: null,
        lastPlayed: lastPlayedMap.get('liked-songs') || null,
      });

    if (isFulfilled(playlistsResult)) {
      playlistsResult.value.body.items.forEach(p => {
        libraryItems.push({
          id: p.id, type: 'playlist', name: p.name,
          imageUrl: p.images?.[0]?.url,
          subtitle: `Playlist • ${p.owner.display_name || 'Unknown'}`,
          creator: p.owner.display_name || 'Unknown',
          dateAdded: null,
          lastPlayed: lastPlayedMap.get(p.id) || null
        });
      });
    }

    if (isFulfilled(albumsResult)) {
      albumsResult.value.body.items.forEach(a => {
        libraryItems.push({
          id: a.album.id, type: 'album', name: a.album.name,
          imageUrl: a.album.images?.[0]?.url,
          subtitle: `Album • ${a.album.artists.map(art => art.name).join(', ')}`,
          creator: a.album.artists[0].name,
          dateAdded: new Date(a.added_at),
          lastPlayed: lastPlayedMap.get(a.album.id) || null
        });
      });
    }

    if (filter) {
      libraryItems = libraryItems.filter(item => item.type === filter);
    }
    
    const sortType = sort || 'recents';
    switch (sortType) {
      case 'alpha':
        libraryItems.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'added':
        libraryItems.sort((a, b) => (b.dateAdded?.getTime() || 0) - (a.dateAdded?.getTime() || 0));
        break;
      case 'creator':
        libraryItems.sort((a, b) => a.creator.localeCompare(b.creator));
        break;
      case 'recents':
      default:
        libraryItems.sort((a, b) => (b.lastPlayed?.getTime() || 0) - (a.lastPlayed?.getTime() || 0));
        break;
    }

    setCachedData(cacheKey, libraryItems);
    return libraryItems;

  } catch (e) {
    console.error("Ошибка в getLibraryData:", e);
    return null;
  }
}

export async function getMainContentData() {
  const cacheKey = 'main_content';
  const cached = getCachedData<{
    playlists: SpotifyApi.PlaylistObjectSimplified[] | null;
    albums: SpotifyApi.SavedAlbumObject[] | null;
    newReleases: SpotifyApi.AlbumObjectSimplified[] | null;
  }>(cacheKey);
  if (cached) {
    return cached;
  }

  const data = {
    playlists: null as SpotifyApi.PlaylistObjectSimplified[] | null,
    albums: null as SpotifyApi.SavedAlbumObject[] | null,
    newReleases: null as SpotifyApi.AlbumObjectSimplified[] | null,
  };

  try {
    const spotifyApi = await getSpotifyServerApi();

    const [playlistsResult, savedAlbumsResult, newReleasesResult] = await Promise.allSettled([
      spotifyApi.getUserPlaylists({ limit: 20 }),
      spotifyApi.getMySavedAlbums({ limit: 20 }),
      spotifyApi.getNewReleases({ limit: 12, country: 'RU' }),
    ]);

    if (isFulfilled(playlistsResult)) {
      data.playlists = playlistsResult.value.body.items;
    }
    if (isFulfilled(savedAlbumsResult)) {
      data.albums = savedAlbumsResult.value.body.items;
    }
    if (isFulfilled(newReleasesResult)) {
      data.newReleases = newReleasesResult.value.body.albums.items;
    }

    setCachedData(cacheKey, data);
    return data;
  } catch (e) {
    console.error("Ошибка в getMainContentData:", e);
    return data;
  }
}

export async function getRecentlyPlayedTracks(limit: number = 20) {
  try {
    const spotifyApi = await getSpotifyServerApi();
    const result = await spotifyApi.getMyRecentlyPlayedTracks({ limit });
    
    // Убираем дубликаты и возвращаем уникальные треки
    const uniqueTracks = result.body.items
      .filter((item, index, self) => 
        index === self.findIndex(t => t.track.id === item.track.id)
      )
      .slice(0, limit)
      .map(item => ({
        id: item.track.id,
        uri: item.track.uri || '',
        name: item.track.name,
        duration_ms: item.track.duration_ms,
        artists: item.track.artists.map(artist => ({
          name: artist.name,
          uri: artist.uri || ''
        })),
        album: {
          name: item.track.album.name,
          uri: item.track.album.uri || '',
          images: item.track.album.images
        },
        played_at: item.played_at
      }));

    return uniqueTracks;
  } catch (e) {
    console.error("Ошибка в getRecentlyPlayedTracks:", e);
    return [];
  }
}

export async function getLikedSongs() {
  const cacheKey = 'liked_songs';
  const cached = getCachedData<SpotifyApi.PlaylistObjectFull>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    console.log('Getting liked songs');
    const spotifyApi = await getSpotifyServerApi();
    console.log('Spotify API initialized');
    
    // Ограничиваем до 200 треков для ускорения загрузки
    const allTracks = [];
    let offset = 0;
    const limit = 50;
    const maxTracks = 200;
    
    while (allTracks.length < maxTracks) {
      const result = await spotifyApi.getMySavedTracks({ 
        limit, 
        offset 
      });
      
      allTracks.push(...result.body.items);
      
      // Если получили меньше треков чем лимит, значит это последняя страница
      if (result.body.items.length < limit) {
        break;
      }
      
      offset += limit;
    }
    
    console.log(`Liked songs data retrieved successfully: ${allTracks.length} tracks`);
    
    // Преобразуем в формат плейлиста для совместимости
    const likedSongsPlaylist = {
      id: 'liked-songs',
      name: 'Liked Songs',
      description: 'Your liked songs',
      images: [{ url: 'https://misc.scdn.co/liked-songs/liked-songs-300.png' }],
      owner: { display_name: 'You' },
      followers: { total: allTracks.length },
      tracks: {
        items: allTracks.map(item => ({
          track: item.track
        }))
      }
    };
    
    setCachedData(cacheKey, likedSongsPlaylist);
    return likedSongsPlaylist;
  } catch (e) {
    console.error('Ошибка в getLikedSongs:', e);
    return null;
  }
}

export async function getPlaylistById(playlistId: string) {
  const cacheKey = `playlist_${playlistId}`;
  const cached = getCachedData<SpotifyApi.PlaylistObjectFull>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    console.log('Getting playlist by ID:', playlistId);
    
    // Специальная обработка для Liked Songs
    if (playlistId === 'liked-songs') {
      return await getLikedSongs();
    }
    
    const spotifyApi = await getSpotifyServerApi();
    console.log('Spotify API initialized');
    
    const result = await spotifyApi.getPlaylist(playlistId);
    console.log('Playlist data retrieved successfully');
    
    setCachedData(cacheKey, result.body);
    return result.body;
  } catch (e) {
    console.error('Ошибка в getPlaylistById:', e);
    return null;
  }
}

export async function getAlbumById(albumId: string) {
  const cacheKey = `album_${albumId}`;
  const cached = getCachedData<SpotifyApi.AlbumObjectFull>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    console.log('Getting album by ID:', albumId);
    const spotifyApi = await getSpotifyServerApi();
    console.log('Spotify API initialized');
    
    const result = await spotifyApi.getAlbum(albumId);
    console.log('Album data retrieved successfully');
    
    setCachedData(cacheKey, result.body);
    return result.body;
  } catch (e) {
    console.error('Ошибка в getAlbumById:', e);
    return null;
  }
}