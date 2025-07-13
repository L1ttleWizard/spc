'use client';

import React from 'react';
import ContentPageClient from './ContentPageClient';
import LikedSongsLoader from './LikedSongsLoader';
import LikedSongsProgress from './LikedSongsProgress';
import { useLazyLikedSongs } from '@/hooks/useLazyLikedSongs';
import { Track } from '@/types/spotify';

interface LikedSongsPageClientProps {
  initialData: any; // Keep for compatibility but not used
}

export default function LikedSongsPageClient({ initialData }: LikedSongsPageClientProps) {
  const {
    data,
    isLoading,
    isInitialLoading,
    isBackgroundLoading,
    error,
    progress,
    refresh,
    loadMore,
    isComplete,
  } = useLazyLikedSongs();

  // Show loading screen only for initial load
  if (isInitialLoading) {
    return <LikedSongsLoader onComplete={() => {}} />;
  }

  // Show error state
  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-white mb-4">
            Unable to Load Liked Songs
          </h1>
          <p className="text-gray-300 mb-6">
            {error}
          </p>
          <button
            onClick={refresh}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show content even if we have partial data
  if (data) {
    const tracks = data.tracks?.items?.map(item => item.track).filter(Boolean) as Track[];
    
    return (
      <>
        <ContentPageClient
          type="playlist"
          name={data.name}
          imageUrl={data.images?.[0]?.url}
          owner={data.owner?.display_name}
          trackCount={data.followers?.total || tracks.length} // Show total count, not just loaded
          followers={data.followers?.total}
          tracks={tracks}
          playlistUri={undefined} // Liked songs don't have a playlist URI
        />
        
        {/* Progress indicator */}
        <LikedSongsProgress
          progress={progress}
          isBackgroundLoading={isBackgroundLoading}
          isComplete={isComplete}
          error={error}
          onRefresh={loadMore}
        />
        
        {/* Manual load more button for debugging */}
        {!isComplete && progress.loaded < progress.total && (
          <div className="fixed bottom-4 left-4 bg-blue-900/90 backdrop-blur-sm border border-blue-700 rounded-lg p-4 shadow-lg z-50">
            <div className="space-y-2">
              <div className="text-xs text-blue-300">
                Progress: {progress.loaded}/{progress.total} ({progress.percentage}%)
              </div>
              <button
                onClick={loadMore}
                disabled={isBackgroundLoading}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  isBackgroundLoading 
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isBackgroundLoading ? 'Loading...' : `Load More (${progress.total - progress.loaded} remaining)`}
              </button>
              <div className="text-xs text-blue-300">
                Status: {isComplete ? 'Complete' : isBackgroundLoading ? 'Loading' : 'Ready'}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback loading state
  return <LikedSongsLoader onComplete={() => {}} />;
} 