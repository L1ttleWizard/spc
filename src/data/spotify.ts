/**
 * Spotify data fetching and caching utilities
 */

import { getSpotifyServerApi, fetchWithRetry } from '@/lib/spotify-server';
import { LibraryItem, LibrarySortType, LibraryFilterType, CacheEntry } from '@/types';
import { CACHE_CONFIG, DEFAULT_IMAGES, TIMEOUT_CONFIG, RATE_LIMIT } from '@/constants';
import { getArtistNames } from '@/lib/utils';

// In-memory cache with proper typing
const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Retrieves cached data if still valid
 */
function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key) as CacheEntry<T> | undefined;
  
  if (cached && Date.now() - cached.timestamp < CACHE_CONFIG.DURATION) {
    return cached.data;
  }
  
  // Clean up expired cache entry
  if (cached) {
    cache.delete(key);
  }
  
  return null;
}

/**
 * Stores data in cache with timestamp
 */
function setCachedData<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Helper function to check if a promise is fulfilled
 */
function isFulfilled<T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> {
  return result.status === 'fulfilled';
}

/**
 * Enhanced error handling for Spotify API calls
 */
async function handleSpotifyApiCall<T>(
  apiCall: () => Promise<T>,
  context: string
): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error) {
    console.error(`❌ Error in ${context}:`, error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
        console.warn(`⚠️ Timeout in ${context}, returning null`);
        return null;
      }
      
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        console.warn(`⚠️ Rate limited in ${context}, returning null`);
        return null;
      }
      
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        console.warn(`⚠️ Authentication error in ${context}, returning null`);
        return null;
      }
    }
    
    return null;
  }
}

/**
 * Fetches user library with enhanced error handling
 */
export async function getUserLibrary(
  sort: LibrarySortType = 'recents',
  filter?: LibraryFilterType,
  limit: number = CACHE_CONFIG.DEFAULT_LIMIT
): Promise<LibraryItem[]> {
  const cacheKey = `library_${sort}_${filter || 'all'}_${limit}`;
  const cached = getCachedData<LibraryItem[]>(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const spotifyApi = await getSpotifyServerApi();
    const items: LibraryItem[] = [];

    if (!filter || filter === 'playlist') {
      const playlistsResult = await handleSpotifyApiCall(
        () => spotifyApi.getUserPlaylists({ limit }),
        'getUserPlaylists'
      );
      
      if (playlistsResult) {
        items.push(...playlistsResult.body.items.map(playlist => ({
          id: playlist.id,
          name: playlist.name,
          type: 'playlist' as const,
          imageUrl: playlist.images?.[0]?.url || DEFAULT_IMAGES.PLACEHOLDER,
          subtitle: `Playlist • ${playlist.owner?.display_name || 'Unknown'}`,
          creator: playlist.owner?.display_name || 'Unknown',
          dateAdded: null,
          lastPlayed: null,
        })));
      }
    }

    if (!filter || filter === 'album') {
      const albumsResult = await handleSpotifyApiCall(
        () => spotifyApi.getMySavedAlbums({ limit }),
        'getMySavedAlbums'
      );
      
      if (albumsResult) {
        items.push(...albumsResult.body.items.map(savedAlbum => ({
          id: savedAlbum.album.id,
          name: savedAlbum.album.name,
          type: 'album' as const,
          imageUrl: savedAlbum.album.images?.[0]?.url || DEFAULT_IMAGES.PLACEHOLDER,
          subtitle: `Album • ${getArtistNames(savedAlbum.album.artists)}`,
          creator: savedAlbum.album.artists[0]?.name || 'Unknown',
          dateAdded: new Date(savedAlbum.added_at),
          lastPlayed: null,
        })));
      }
    }

    // Sort items based on sort parameter
    if (sort === 'recents') {
      // For recents, we'd need to fetch recently played and sort by added date
      // This is a simplified version
      items.sort((a, b) => (b.dateAdded?.getTime() || 0) - (a.dateAdded?.getTime() || 0));
    } else if (sort === 'alpha') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'creator') {
      items.sort((a, b) => a.creator.localeCompare(b.creator));
    } else if (sort === 'added') {
      items.sort((a, b) => (b.dateAdded?.getTime() || 0) - (a.dateAdded?.getTime() || 0));
    }

    setCachedData(cacheKey, items);
    return items;
  } catch (error) {
    console.error('❌ Error fetching user library:', error);
    return [];
  }
}

/**
 * Fetches album data with enhanced error handling
 */
export async function getAlbumById(albumId: string): Promise<SpotifyApi.SingleAlbumResponse | null> {
  const cacheKey = `album_${albumId}`;
  const cached = getCachedData<SpotifyApi.SingleAlbumResponse>(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const spotifyApi = await getSpotifyServerApi();
    const albumResult = await handleSpotifyApiCall(
      () => spotifyApi.getAlbum(albumId),
      `getAlbumById(${albumId})`
    );
    
    if (albumResult) {
      setCachedData(cacheKey, albumResult.body);
      return albumResult.body;
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Error fetching album ${albumId}:`, error);
    return null;
  }
}

/**
 * Fetches playlist data with enhanced error handling
 */
export async function getPlaylistById(playlistId: string): Promise<SpotifyApi.SinglePlaylistResponse | null> {
  const cacheKey = `playlist_${playlistId}`;
  const cached = getCachedData<SpotifyApi.SinglePlaylistResponse>(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const spotifyApi = await getSpotifyServerApi();
    const playlistResult = await handleSpotifyApiCall(
      () => spotifyApi.getPlaylist(playlistId),
      `getPlaylistById(${playlistId})`
    );
    
    if (playlistResult) {
      setCachedData(cacheKey, playlistResult.body);
      return playlistResult.body;
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Error fetching playlist ${playlistId}:`, error);
    return null;
  }
}

/**
 * Fetches liked songs with enhanced error handling
 */
export async function getLikedSongs(): Promise<SpotifyApi.UsersSavedTracksResponse | null> {
  const cacheKey = 'liked_songs';
  const cached = getCachedData<SpotifyApi.UsersSavedTracksResponse>(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const spotifyApi = await getSpotifyServerApi();
    const likedSongsResult = await handleSpotifyApiCall(
      () => spotifyApi.getMySavedTracks({ limit: CACHE_CONFIG.MAX_TRACKS }),
      'getLikedSongs'
    );
    
    if (likedSongsResult) {
      setCachedData(cacheKey, likedSongsResult.body);
      return likedSongsResult.body;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error fetching liked songs:', error);
    return null;
  }
}

/**
 * Fetches main content data with enhanced error handling
 */
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
    console.log('🎵 Initializing Spotify API...');
    const spotifyApi = await getSpotifyServerApi();
    console.log('✅ Spotify API initialized successfully');

    console.log('🎵 Fetching user data from Spotify...');
    
    // Use Promise.allSettled with individual error handling
    const [playlistsResult, savedAlbumsResult, newReleasesResult] = await Promise.allSettled([
      handleSpotifyApiCall(() => spotifyApi.getUserPlaylists({ limit: 20 }), 'getUserPlaylists'),
      handleSpotifyApiCall(() => spotifyApi.getMySavedAlbums({ limit: 20 }), 'getMySavedAlbums'),
      handleSpotifyApiCall(() => spotifyApi.getNewReleases({ limit: 12, country: 'RU' }), 'getNewReleases'),
    ]);

    // Log results for debugging
    console.log('📊 Spotify API results:', {
      playlists: playlistsResult.status,
      albums: savedAlbumsResult.status,
      newReleases: newReleasesResult.status
    });

    if (isFulfilled(playlistsResult) && playlistsResult.value) {
      data.playlists = playlistsResult.value.body.items;
      console.log(`✅ Fetched ${data.playlists.length} playlists`);
    } else {
      console.warn('⚠️ Failed to fetch playlists');
    }

    if (isFulfilled(savedAlbumsResult) && savedAlbumsResult.value) {
      data.albums = savedAlbumsResult.value.body.items;
      console.log(`✅ Fetched ${data.albums.length} saved albums`);
    } else {
      console.warn('⚠️ Failed to fetch saved albums');
    }

    if (isFulfilled(newReleasesResult) && newReleasesResult.value) {
      data.newReleases = newReleasesResult.value.body.albums.items;
      console.log(`✅ Fetched ${data.newReleases.length} new releases`);
    } else {
      console.warn('⚠️ Failed to fetch new releases');
    }

    setCachedData(cacheKey, data);
    console.log('✅ Main content data fetched successfully:', { 
      playlists: data.playlists?.length || 0, 
      albums: data.albums?.length || 0, 
      newReleases: data.newReleases?.length || 0 
    });
    return data;
  } catch (e) {
    console.error("❌ Error in getMainContentData:", e);
    
    // Check if it's an authentication error
    if (e instanceof Error && e.message.includes('access token')) {
      console.log('🔑 Authentication error - user needs to connect Spotify');
    }
    
    // Return empty data instead of throwing
    return data;
  }
}

/**
 * Enhanced search function with timeout and error handling
 */
export async function searchSpotify(q: string, accessToken: string) {
  if (!q || !accessToken) return { tracks: [], albums: [], artists: [], playlists: [] };
  
  try {
    const params = new URLSearchParams({
      q,
      type: 'track,album,artist,playlist',
      limit: '8',
    });
    
    const response = await fetchWithRetry(
      `https://api.spotify.com/v1/search?${params}`,
      { 
        headers: { Authorization: `Bearer ${accessToken}` },
      },
      RATE_LIMIT.MAX_RETRIES,
      TIMEOUT_CONFIG.REQUEST_TIMEOUT
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      tracks: data.tracks?.items || [],
      albums: data.albums?.items || [],
      artists: data.artists?.items || [],
      playlists: data.playlists?.items || [],
    };
  } catch (e) {
    console.error('❌ Spotify search error:', e);
    return { tracks: [], albums: [], artists: [], playlists: [] };
  }
}