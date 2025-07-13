"use client";

import { Playlist, Track } from '@/types/spotify';

interface CachedLikedSongs {
  data: Playlist;
  timestamp: number;
  totalTracks: number;
  loadedTracks: number;
  isComplete: boolean;
}

const CACHE_KEY = 'liked_songs_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const BATCH_SIZE = 50; // Number of tracks to load per batch - no maximum limit

export class LikedSongsCache {
  private static instance: LikedSongsCache;
  private cache: CachedLikedSongs | null = null;

  static getInstance(): LikedSongsCache {
    if (!LikedSongsCache.instance) {
      LikedSongsCache.instance = new LikedSongsCache();
    }
    return LikedSongsCache.instance;
  }

  // Get cached data
  getCachedData(): CachedLikedSongs | null {
    if (this.cache) {
      return this.cache;
    }

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as CachedLikedSongs;
        const isExpired = Date.now() - parsed.timestamp > CACHE_DURATION;
        
        if (!isExpired) {
          this.cache = parsed;
          return parsed;
        } else {
          // Clear expired cache
          this.clearCache();
        }
      }
    } catch (error) {
      console.warn('⚠️ Error reading liked songs cache:', error);
      this.clearCache();
    }

    return null;
  }

  // Save data to cache
  saveToCache(data: Playlist, totalTracks: number, loadedTracks: number, isComplete: boolean = false): void {
    const cacheData: CachedLikedSongs = {
      data,
      timestamp: Date.now(),
      totalTracks,
      loadedTracks,
      isComplete,
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      this.cache = cacheData;
    } catch (error) {
      console.warn('⚠️ Error saving liked songs cache:', error);
    }
  }

  // Update existing cache with more tracks
  updateCache(newTracks: Track[], loadedTracks: number, isComplete: boolean = false): void {
    const cached = this.getCachedData();
    if (!cached) return;

    // Add new tracks to existing data
    const updatedTracks = [...cached.data.tracks.items];
    newTracks.forEach(track => {
      updatedTracks.push({
        track,
        added_at: new Date().toISOString()
      });
    });

    const updatedData: Playlist = {
      ...cached.data,
      tracks: {
        items: updatedTracks
      }
    };

    this.saveToCache(updatedData, cached.totalTracks, loadedTracks, isComplete);
  }

  // Clear cache
  clearCache(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
      this.cache = null;
    } catch (error) {
      console.warn('⚠️ Error clearing liked songs cache:', error);
    }
  }

  // Check if cache is stale (older than 1 hour)
  isCacheStale(): boolean {
    const cached = this.getCachedData();
    if (!cached) return true;

    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    return Date.now() - cached.timestamp > oneHour;
  }

  // Get batch size for loading
  getBatchSize(): number {
    return BATCH_SIZE;
  }

  // Get tracks that are already cached
  getCachedTracks(): Track[] {
    const cached = this.getCachedData();
    if (!cached) return [];

    return cached.data.tracks.items.map(item => item.track).filter(Boolean);
  }

  // Check if we have a complete cache
  isComplete(): boolean {
    const cached = this.getCachedData();
    return cached?.isComplete || false;
  }

  // Get loading progress
  getProgress(): { loaded: number; total: number; percentage: number } {
    const cached = this.getCachedData();
    if (!cached) {
      return { loaded: 0, total: 0, percentage: 0 };
    }

    const percentage = Math.round((cached.loadedTracks / cached.totalTracks) * 100);
    return {
      loaded: cached.loadedTracks,
      total: cached.totalTracks,
      percentage
    };
  }

  // Check if we can load more tracks
  canLoadMore(): boolean {
    const cached = this.getCachedData();
    if (!cached) return true;
    
    return cached.loadedTracks < cached.totalTracks;
  }

  // Get remaining tracks count
  getRemainingCount(): number {
    const cached = this.getCachedData();
    if (!cached) return 0;
    
    return Math.max(0, cached.totalTracks - cached.loadedTracks);
  }
}

export const likedSongsCache = LikedSongsCache.getInstance(); 