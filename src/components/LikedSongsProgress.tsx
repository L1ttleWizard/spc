"use client";

import React from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface LikedSongsProgressProps {
  progress: { loaded: number; total: number; percentage: number };
  isBackgroundLoading: boolean;
  isComplete: boolean;
  error: string | null;
  onRefresh?: () => void;
}

export default function LikedSongsProgress({
  progress,
  isBackgroundLoading,
  isComplete,
  error,
  onRefresh
}: LikedSongsProgressProps) {
  if (error) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-900/90 backdrop-blur-sm border border-red-700 rounded-lg p-4 shadow-lg z-50 max-w-sm">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
          <div className="flex-1 min-w-0">
            <p className="text-red-200 text-sm font-medium">Error Loading Tracks</p>
            <p className="text-red-300 text-xs truncate">{error}</p>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-red-300 hover:text-red-100 transition-colors"
              title="Retry"
            >
              <RefreshCw size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="fixed bottom-4 right-4 bg-green-900/90 backdrop-blur-sm border border-green-700 rounded-lg p-4 shadow-lg z-50 max-w-sm">
        <div className="flex items-center gap-3">
          <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
          <div className="flex-1">
            <p className="text-green-200 text-sm font-medium">All Tracks Loaded</p>
            <p className="text-green-300 text-xs">{progress.total} liked songs</p>
          </div>
        </div>
      </div>
    );
  }

  // Show manual load more button when not loading and not complete
  if (!isBackgroundLoading && !isComplete && progress.loaded < progress.total) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-900/90 backdrop-blur-sm border border-blue-700 rounded-lg p-4 shadow-lg z-50 max-w-sm">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-blue-200 text-sm font-medium">Load More Tracks</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-blue-800 rounded-full h-2">
                <div 
                  className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <span className="text-blue-300 text-xs font-mono">
                {progress.loaded}/{progress.total}
              </span>
            </div>
            <p className="text-blue-300 text-xs mt-1">
              {progress.total - progress.loaded} more tracks available
            </p>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
              title="Load more tracks"
            >
              Load More
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isBackgroundLoading) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-900/90 backdrop-blur-sm border border-blue-700 rounded-lg p-4 shadow-lg z-50 max-w-sm">
        <div className="flex items-center gap-3">
          <RefreshCw className="text-blue-400 flex-shrink-0 animate-spin" size={20} />
          <div className="flex-1">
            <p className="text-blue-200 text-sm font-medium">Loading More Tracks</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-blue-800 rounded-full h-2">
                <div 
                  className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <span className="text-blue-300 text-xs font-mono">
                {progress.loaded}/{progress.total}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
} 