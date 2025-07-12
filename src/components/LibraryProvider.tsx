"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LibraryItem, LibrarySortType, LibraryFilterType } from '@/types';
import { getLibraryDataClient } from '@/lib/spotify-client';
import AppLayout from './AppLayout';

interface LibraryProviderProps {
  children: React.ReactNode;
}

export default function LibraryProvider({ children }: LibraryProviderProps) {
  const [libraryItems, setLibraryItems] = useState<LibraryItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const searchParams = useSearchParams();

  // Get sort and filter from URL params
  const sort = (searchParams.get('sort') as LibrarySortType) || 'recents';
  const filter = (searchParams.get('filter') as LibraryFilterType) || 'playlist';

  useEffect(() => {
    let isMounted = true;

    const fetchLibraryData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await getLibraryDataClient(sort, filter);
        
        if (isMounted) {
          setLibraryItems(data);
          setIsAuthenticated(true);
        }
      } catch (err) {
        if (isMounted) {
          // Check if it's an authentication error
          if (err instanceof Error && err.message.includes('401')) {
            setIsAuthenticated(false);
            setError('Please log in to view your library');
          } else {
            setError(err instanceof Error ? err.message : 'Failed to load library');
          }
          console.error('Error fetching library data:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchLibraryData();

    return () => {
      isMounted = false;
    };
  }, [sort, filter]);

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
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-red-400 text-sm">Failed to load library</p>
          <p className="text-neutral-400 text-xs">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-green-500 text-black rounded-full text-sm font-semibold hover:bg-green-400 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout 
      sidebarItems={libraryItems}
      currentSort={sort}
      currentFilter={filter}
    >
      {children}
    </AppLayout>
  );
} 