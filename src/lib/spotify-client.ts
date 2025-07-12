/**
 * Client-side Spotify API utilities
 */

import { LibraryItem, LibrarySortType, LibraryFilterType } from '@/types';
import { CACHE_CONFIG, DEFAULT_IMAGES } from '@/constants';
import { getImageUrl, getArtistNames } from '@/lib/utils';

// In-memory cache for client-side
const clientCache = new Map<string, { data: unknown; timestamp: number }>();

/**
 * Retrieves cached data if still valid
 */
function getCachedData<T>(key: string): T | null {
  const cached = clientCache.get(key) as { data: T; timestamp: number } | undefined;
  
  if (cached && Date.now() - cached.timestamp < CACHE_CONFIG.DURATION) {
    return cached.data;
  }
  
  // Clean up expired cache entry
  if (cached) {
    clientCache.delete(key);
  }
  
  return null;
}

/**
 * Stores data in cache with timestamp
 */
function setCachedData<T>(key: string, data: T): void {
  clientCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Clears all cache entries
 */
export function clearClientCache(): void {
  clientCache.clear();
}

/**
 * Fetches user's library data from the client-side API endpoint
 */
export async function getLibraryDataClient(
  sort?: LibrarySortType,
  filter?: LibraryFilterType
): Promise<LibraryItem[] | null> {
  const cacheKey = `library_${sort || 'recents'}_${filter || 'all'}`;
  const cached = getCachedData<LibraryItem[]>(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const params = new URLSearchParams();
    if (sort) params.append('sort', sort);
    if (filter) params.append('filter', filter);

    const response = await fetch(`/api/library?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${data.error || 'Unknown error'}`);
    }
    
    if (data.error) {
      throw new Error(data.error);
    }

    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching library data:', error);
    return null;
  }
} 