"use client";

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import AppLayout from './AppLayout';
import { LibraryItem, LibrarySortType, LibraryFilterType } from '@/types';
import { getLibraryDataClient, preloadLikedSongsClient } from '@/lib/spotify-client';
import { selectShowPlayerSidebar } from '@/redux/slices/playerSlice';
import type { RootState } from '@/redux/store';

interface LibraryProviderProps {
  children: React.ReactNode;
}

export default function LibraryProvider({ children }: LibraryProviderProps) {
  const [libraryItems, setLibraryItems] = useState<LibraryItem[] | null>(null);
  const [sort, setSort] = useState<LibrarySortType>('recents');
  const [filter, setFilter] = useState<LibraryFilterType>('playlist');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const user = useSelector((state: RootState) => state.user.user);
  const userStatus = useSelector((state: RootState) => state.user.status);
  const showPlayerSidebar = useSelector(selectShowPlayerSidebar);

  useEffect(() => {
    const fetchLibraryData = async () => {
      if (userStatus === 'loading') return;
      
      if (!user) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);
      setIsLoading(true);
      setError(null);

      try {
        const data = await getLibraryDataClient(sort, filter);
        setLibraryItems(data);
        
        // Start background preloading of liked songs for better performance
        preloadLikedSongsClient();
      } catch (err) {
        console.error('Failed to fetch library data:', err);
        
        // Check if it's an authentication error
        if (err instanceof Error && err.message.includes('Not authenticated')) {
          setError('Please connect your Spotify account to view your library');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to fetch library data');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchLibraryData();
  }, [user, userStatus, sort, filter]);

  // Show loading state while fetching library data
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-sm">Loading your library...</p>
        </div>
      </div>
    );
  }

  // Show authentication required state
  if (isAuthenticated === false) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-neutral-400 text-sm">Please log in to view your library</p>
          <button 
            onClick={() => window.location.href = '/login'} 
            className="px-4 py-2 bg-green-500 text-black rounded-full text-sm font-semibold hover:bg-green-400 transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  // Show error state if library data failed to load
  if (error && isAuthenticated !== false) {
    const isAuthError = error.includes('connect your Spotify account');
    
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-red-400 text-sm">
            {isAuthError ? 'Spotify Connection Required' : 'Failed to load library'}
          </p>
          <p className="text-neutral-400 text-xs max-w-md">{error}</p>
          <div className="flex gap-2">
            {isAuthError ? (
              <button 
                onClick={() => window.location.href = '/login'} 
                className="px-4 py-2 bg-green-500 text-black rounded-full text-sm font-semibold hover:bg-green-400 transition-colors"
              >
                Connect Spotify
              </button>
            ) : (
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-green-500 text-black rounded-full text-sm font-semibold hover:bg-green-400 transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout 
      sidebarItems={libraryItems}
      currentSort={sort}
      currentFilter={filter}
      showPlayerSidebar={showPlayerSidebar}
    >
      {children}
    </AppLayout>
  );
} 