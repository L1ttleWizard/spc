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
    console.error(`❌ Error type:`, typeof error);
    console.error(`❌ Error constructor:`, error?.constructor?.name);
    console.error(`❌ Error message:`, error instanceof Error ? error.message : 'No message');
    console.error(`❌ Error stack:`, error instanceof Error ? error.stack : 'No stack');
    
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
      
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        console.warn(`⚠️ Not Found error in ${context}, returning null`);
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
      // Add Liked Songs playlist at the top
      items.push({
        id: 'liked-songs',
        name: 'Liked Songs',
        type: 'playlist' as const,
        imageUrl: '/heart-playlist.svg', // Heart icon SVG
        subtitle: 'Playlist • Your liked songs',
        creator: 'You',
        dateAdded: null,
        lastPlayed: null,
      });

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

    // Ensure Liked Songs playlist is always at the top
    if (filter === 'playlist' || !filter) {
      const likedSongsIndex = items.findIndex(item => item.id === 'liked-songs');
      if (likedSongsIndex > 0) {
        const likedSongs = items.splice(likedSongsIndex, 1)[0];
        if (likedSongs) {
          items.unshift(likedSongs);
        }
      }
    }

    setCachedData(cacheKey, items);
    return items;
  } catch (error) {
    console.error('❌ Error fetching user library:', error);
    return [];
  }
}

/**
 * Fetches artist data by ID with full details
 */
export async function getArtistById(artistId: string): Promise<SpotifyApi.SingleArtistResponse | null> {
  const cacheKey = `artist_${artistId}`;
  const cached = getCachedData<SpotifyApi.SingleArtistResponse>(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const spotifyApi = await getSpotifyServerApi();
    
    console.log(`🎵 Fetching artist ${artistId}...`);
    
    const artistResult = await handleSpotifyApiCall(
      () => spotifyApi.getArtist(artistId),
      `getArtistById(${artistId})`
    );
    
    if (!artistResult) {
      console.log(`❌ Failed to fetch artist ${artistId}`);
      return null;
    }
    
    console.log(`✅ Successfully fetched artist ${artistId}: ${artistResult.body.name}`);
    setCachedData(cacheKey, artistResult.body);
    return artistResult.body;
    
  } catch (error) {
    console.error(`❌ Error fetching artist ${artistId}:`, error);
    return null;
  }
}

/**
 * Fetches artist's top tracks
 */
export async function getArtistTopTracks(artistId: string, market: string = 'US'): Promise<SpotifyApi.ArtistsTopTracksResponse | null> {
  const cacheKey = `artist_top_tracks_${artistId}_${market}`;
  const cached = getCachedData<SpotifyApi.ArtistsTopTracksResponse>(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const spotifyApi = await getSpotifyServerApi();
    
    console.log(`🎵 Fetching top tracks for artist ${artistId}...`);
    
    const topTracksResult = await handleSpotifyApiCall(
      () => spotifyApi.getArtistTopTracks(artistId, market),
      `getArtistTopTracks(${artistId}, ${market})`
    );
    
    if (!topTracksResult) {
      console.log(`❌ Failed to fetch top tracks for artist ${artistId}`);
      return null;
    }
    
    console.log(`✅ Successfully fetched ${topTracksResult.body.tracks.length} top tracks for artist ${artistId}`);
    setCachedData(cacheKey, topTracksResult.body);
    return topTracksResult.body;
    
  } catch (error) {
    console.error(`❌ Error fetching top tracks for artist ${artistId}:`, error);
    return null;
  }
}

/**
 * Fetches artist's albums with pagination
 */
export async function getArtistAlbums(artistId: string, includeGroups: string[] = ['album', 'single']): Promise<SpotifyApi.ArtistsAlbumsResponse | null> {
  const cacheKey = `artist_albums_${artistId}_${includeGroups.join(',')}`;
  const cached = getCachedData<SpotifyApi.ArtistsAlbumsResponse>(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const spotifyApi = await getSpotifyServerApi();
    
    console.log(`🎵 Fetching albums for artist ${artistId}...`);
    
    const albumsResult = await handleSpotifyApiCall(
      () => spotifyApi.getArtistAlbums(artistId, { 
        include_groups: includeGroups.join(','),
        limit: 50
      }),
      `getArtistAlbums(${artistId})`
    );
    
    if (!albumsResult) {
      console.log(`❌ Failed to fetch albums for artist ${artistId}`);
      return null;
    }
    
    console.log(`✅ Successfully fetched ${albumsResult.body.items.length} albums for artist ${artistId}`);
    setCachedData(cacheKey, albumsResult.body);
    return albumsResult.body;
    
  } catch (error) {
    console.error(`❌ Error fetching albums for artist ${artistId}:`, error);
    return null;
  }
}

/**
 * Fetches related artists
 */
export async function getRelatedArtists(artistId: string): Promise<SpotifyApi.ArtistsRelatedArtistsResponse | null> {
  const cacheKey = `related_artists_${artistId}`;
  const cached = getCachedData<SpotifyApi.ArtistsRelatedArtistsResponse>(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const spotifyApi = await getSpotifyServerApi();
    
    console.log(`🎵 Fetching related artists for ${artistId}...`);
    
    console.log(`🔍 Calling handleSpotifyApiCall for related artists of ${artistId}...`);
    const relatedResult = await handleSpotifyApiCall(
      () => spotifyApi.getArtistRelatedArtists(artistId),
      `getRelatedArtists(${artistId})`
    );
    
    console.log(`🔍 handleSpotifyApiCall result for ${artistId}:`, {
      hasResult: !!relatedResult,
      hasBody: !!relatedResult?.body,
      hasArtists: !!relatedResult?.body?.artists,
      artistsLength: relatedResult?.body?.artists?.length || 0
    });
    
    if (!relatedResult) {
      console.log(`❌ Failed to fetch related artists for ${artistId} - handleSpotifyApiCall returned null`);
      return null;
    }
    
    console.log(`✅ Successfully fetched ${relatedResult.body.artists.length} related artists for ${artistId}`);
    setCachedData(cacheKey, relatedResult.body);
    return relatedResult.body;
    
  } catch (error) {
    console.error(`❌ Error fetching related artists for ${artistId}:`, error);
    return null;
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
 * Fetches playlist data with ALL tracks using pagination
 */
export async function getPlaylistById(playlistId: string): Promise<SpotifyApi.SinglePlaylistResponse | null> {
  const cacheKey = `playlist_${playlistId}`;
  const cached = getCachedData<SpotifyApi.SinglePlaylistResponse>(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const spotifyApi = await getSpotifyServerApi();
    
    console.log(`🎵 Fetching playlist ${playlistId} with ALL tracks using pagination...`);
    
    // First, get the playlist metadata
    const playlistResult = await handleSpotifyApiCall(
      () => spotifyApi.getPlaylist(playlistId),
      `getPlaylistById_initial(${playlistId})`
    );
    
    if (!playlistResult) {
      console.log(`❌ Failed to fetch playlist ${playlistId}`);
      return null;
    }
    
    const totalTracks = playlistResult.body.tracks.total;
    console.log(`📊 Playlist ${playlistId} has ${totalTracks} total tracks`);
    
    // If we have 100 or fewer tracks, return the initial result
    if (totalTracks <= 100) {
      console.log(`✅ All ${totalTracks} tracks fetched in single request`);
      setCachedData(cacheKey, playlistResult.body);
      return playlistResult.body;
    }
    
    // For more than 100 tracks, we need to fetch all pages
    const allTracks: SpotifyApi.PlaylistTrackObject[] = [...playlistResult.body.tracks.items];
    const totalPages = Math.ceil(totalTracks / 100);
    
    console.log(`📄 Fetching ${totalPages - 1} additional pages for playlist ${playlistId}...`);
    
    // Fetch remaining pages (starting from offset 100)
    for (let page = 1; page < totalPages; page++) {
      const offset = page * 100;
      
      // Add delay between requests to respect rate limits
      if (page > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`📄 Fetching page ${page + 1}/${totalPages} (offset: ${offset}) for playlist ${playlistId}`);
      
      const pageResult = await handleSpotifyApiCall(
        () => spotifyApi.getPlaylistTracks(playlistId, { 
          limit: 100,
          offset: offset
        }),
        `getPlaylistTracks_page_${page}_${playlistId}`
      );
      
      if (pageResult && pageResult.body.items.length > 0) {
        allTracks.push(...pageResult.body.items);
        console.log(`✅ Page ${page + 1}: fetched ${pageResult.body.items.length} tracks for playlist ${playlistId}`);
      } else {
        console.warn(`⚠️ Page ${page + 1}: no tracks returned for playlist ${playlistId}`);
        break; // Stop if we get an empty page
      }
    }
    
    // Create the complete playlist response object
    const completePlaylist: SpotifyApi.SinglePlaylistResponse = {
      ...playlistResult.body,
      tracks: {
        ...playlistResult.body.tracks,
        items: allTracks,
        total: allTracks.length
      }
    };
    
    console.log(`✅ Successfully fetched ALL ${allTracks.length} tracks for playlist ${playlistId} from ${totalPages} pages`);
    setCachedData(cacheKey, completePlaylist);
    return completePlaylist;
    
  } catch (error) {
    console.error(`❌ Error fetching playlist ${playlistId}:`, error);
    
    // Log specific error details for debugging
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        console.error('🔑 Authentication error - user needs to reconnect Spotify');
      } else if (error.message.includes('403')) {
        console.error('🚫 Permission denied - missing playlist-read scope');
      } else if (error.message.includes('429')) {
        console.error('⏱️ Rate limited - too many requests');
      }
    }
    
    return null;
  }
}

/**
 * Fetches ALL liked songs using pagination with enhanced error handling
 */
export async function getLikedSongs(): Promise<SpotifyApi.UsersSavedTracksResponse | null> {
  const cacheKey = 'liked_songs';
  const cached = getCachedData<SpotifyApi.UsersSavedTracksResponse>(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const spotifyApi = await getSpotifyServerApi();
    
    console.log('🎵 Fetching ALL liked songs from Spotify API using pagination...');
    
    // First, get the initial batch to determine total count
    const initialResult = await handleSpotifyApiCall(
      () => spotifyApi.getMySavedTracks({ 
        limit: 50, // API maximum per request
        market: 'RU'
      }),
      'getLikedSongs_initial'
    );
    
    if (!initialResult) {
      console.log('❌ Failed to fetch initial liked songs batch');
      return null;
    }
    
    const totalTracks = initialResult.body.total;
    console.log(`📊 Total liked songs: ${totalTracks}`);
    
    // If we have 50 or fewer tracks, return the initial result
    if (totalTracks <= 50) {
      console.log(`✅ All ${totalTracks} liked songs fetched in single request`);
      setCachedData(cacheKey, initialResult.body);
      return initialResult.body;
    }
    
    // For more than 50 tracks, we need to fetch all pages
    const allItems: SpotifyApi.SavedTrackObject[] = [...initialResult.body.items];
    const totalPages = Math.ceil(totalTracks / 50);
    
    console.log(`📄 Fetching ${totalPages - 1} additional pages...`);
    
    // Fetch remaining pages (starting from offset 50)
    for (let page = 1; page < totalPages; page++) {
      const offset = page * 50;
      
      // Add delay between requests to respect rate limits
      if (page > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`📄 Fetching page ${page + 1}/${totalPages} (offset: ${offset})`);
      
      const pageResult = await handleSpotifyApiCall(
        () => spotifyApi.getMySavedTracks({ 
          limit: 50,
          offset: offset,
          market: 'RU'
        }),
        `getLikedSongs_page_${page}`
      );
      
      if (pageResult && pageResult.body.items.length > 0) {
        allItems.push(...pageResult.body.items);
        console.log(`✅ Page ${page + 1}: fetched ${pageResult.body.items.length} tracks`);
      } else {
        console.warn(`⚠️ Page ${page + 1}: no tracks returned`);
        break; // Stop if we get an empty page
      }
    }
    
    // Create the complete response object
    const completeResponse: SpotifyApi.UsersSavedTracksResponse = {
      ...initialResult.body,
      items: allItems,
      total: allItems.length
    };
    
    console.log(`✅ Successfully fetched ALL ${allItems.length} liked songs from ${totalPages} pages`);
    setCachedData(cacheKey, completeResponse);
    return completeResponse;
    
  } catch (error) {
    console.error('❌ Error fetching liked songs:', error);
    
    // Log specific error details for debugging
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        console.error('🔑 Authentication error - user needs to reconnect Spotify');
      } else if (error.message.includes('403')) {
        console.error('🚫 Permission denied - missing user-library-read scope');
      } else if (error.message.includes('429')) {
        console.error('⏱️ Rate limited - too many requests');
      }
    }
    
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
      if (playlistsResult.status === 'rejected') {
        console.error('❌ Playlists error:', playlistsResult.reason);
      }
    }

    if (isFulfilled(savedAlbumsResult) && savedAlbumsResult.value) {
      data.albums = savedAlbumsResult.value.body.items;
      console.log(`✅ Fetched ${data.albums.length} saved albums`);
    } else {
      console.warn('⚠️ Failed to fetch saved albums');
      if (savedAlbumsResult.status === 'rejected') {
        const error = savedAlbumsResult.reason;
        console.error('❌ Saved albums error:', error);
        
        // Check if it's a scope error
        if (error instanceof Error && error.message.includes('Insufficient client scope')) {
          console.error('🚫 Scope error: user-library-read permission required');
        }
      }
    }

    if (isFulfilled(newReleasesResult) && newReleasesResult.value) {
      data.newReleases = newReleasesResult.value.body.albums.items;
      console.log(`✅ Fetched ${data.newReleases.length} new releases`);
    } else {
      console.warn('⚠️ Failed to fetch new releases');
      if (newReleasesResult.status === 'rejected') {
        console.error('❌ New releases error:', newReleasesResult.reason);
      }
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

/**
 * Non-blocking function to preload all liked songs in the background
 * This can be called without waiting for the result
 */
export async function preloadLikedSongs(): Promise<void> {
  try {
    console.log('🔄 Starting background preload of liked songs...');
    
    // Don't await this - let it run in the background
    getLikedSongs().then(result => {
      if (result) {
        console.log('✅ Background preload of liked songs completed successfully');
      } else {
        console.log('❌ Background preload of liked songs failed');
      }
    }).catch(error => {
      console.error('❌ Background preload of liked songs error:', error);
    });
    
  } catch (error) {
    console.error('❌ Error starting background preload:', error);
  }
}