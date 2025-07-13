// PlayerSidebar.tsx - Right sidebar for queue and recently played
// Exports default PlayerSidebar component

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useSpotifyPlayerContext } from './SpotifyPlayerProvider';
import { useEnhancedQueue } from '@/hooks/useEnhancedQueue';
import Link from 'next/link';
import Image from 'next/image';
import type { RootState } from '@/redux/store';
import { useSession } from '@/hooks/useSession';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { Play, X, RefreshCw } from 'lucide-react';

interface PlayerSidebarProps {
  onClose: () => void;
}

export default function PlayerSidebar({ onClose }: PlayerSidebarProps) {
  const [tab, setTab] = useState<'queue' | 'recent'>('queue');
  const { queue: spotifyQueue } = useSelector((state: RootState) => state.player);
  
  // Monitor performance
  usePerformanceMonitor('PlayerSidebar');
  
  // Temporarily disable enhanced queue to test track playing
  const currentlyPlaying = null;
  const enhancedQueue: any[] = [];
  const context = { type: 'unknown' as const, id: null, name: null, uri: null };
  const queueLoading = false;
  const queueError = null;
  const refreshQueue = () => {};

  // Recently played state
  const { accessToken } = useSession();
  const [recent, setRecent] = useState<any[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);

  const { playTrack, deviceId } = useSpotifyPlayerContext();

  // Debounced refresh function to prevent rapid successive calls
  const debouncedRefresh = useCallback(() => {
    const timeoutId = setTimeout(() => {
      refreshQueue();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [refreshQueue]);

  useEffect(() => {
    if (tab === 'recent' && accessToken) {
      setRecentLoading(true);
      setRecentError(null);
      fetch('/api/spotify/recently-played', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch recently played');
          return res.json();
        })
        .then(data => {
          setRecent(data.items || []);
          setRecentLoading(false);
        })
        .catch(err => {
          setRecentError(err.message);
          setRecentLoading(false);
        });
    }
  }, [tab, accessToken]);

  const handlePlay = useCallback((track: any, contextUri?: string) => {
    if (track?.uri) {
      playTrack(track.uri);
    }
  }, [playTrack]);

  const renderTrackRow = useCallback((track: any, idx: number, contextUri?: string) => {
    return (
      <div
        key={track.id + idx}
        className="flex items-center gap-3 p-2 rounded hover:bg-neutral-800 cursor-pointer group"
        onClick={() => handlePlay(track, contextUri)}
      >
        <div className="relative">
          <Image
            src={track.album?.images?.[2]?.url || track.album?.images?.[0]?.url || '/placeholder.png'}
            alt={track.name}
            width={40}
            height={40}
            className="rounded"
          />
          {/* Play button overlay */}
          <div className="absolute inset-0 bg-black/60 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play size={16} fill="white" className="text-white" />
          </div>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-white truncate">{track.name}</span>
          <span className="text-xs text-gray-400 truncate">{track.artists?.map((a: any) => a.name).join(', ')}</span>
        </div>
      </div>
    );
  }, [handlePlay]);

  // Memoize queue data to prevent unnecessary re-renders
  const queueData = useMemo(() => {
    const currentTrack = currentlyPlaying || spotifyQueue?.currently_playing;
    const nextTracks = enhancedQueue.length > 0 ? enhancedQueue : (spotifyQueue?.queue || []);
    const playlistName = context.name || spotifyQueue?.playlist_name;
    const playlistId = context.id || spotifyQueue?.playlist_id;
    
    return { currentTrack, nextTracks, playlistName, playlistId };
  }, [currentlyPlaying, spotifyQueue, enhancedQueue, context]);

  const { currentTrack, nextTracks, playlistName, playlistId } = queueData;

  return (
    <div className="fixed top-0 right-0 h-full w-96 bg-neutral-900 shadow-lg z-50 flex flex-col border-l border-gray-800 animate-slide-in">
      <div className="flex items-center justify-between p-4 border-b border-gray-800 relative">
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-t font-semibold ${tab === 'queue' ? 'bg-black text-white' : 'text-gray-400'}`}
            onClick={() => setTab('queue')}
          >
            Queue
          </button>
          <button
            className={`px-4 py-2 rounded-t font-semibold ${tab === 'recent' ? 'bg-black text-white' : 'text-gray-400'}`}
            onClick={() => setTab('recent')}
          >
            Recently Played
          </button>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'queue' && (
            <button
              onClick={debouncedRefresh}
              disabled={queueLoading}
              className="p-1 text-gray-400 hover:text-white hover:bg-neutral-800 rounded transition-colors disabled:opacity-50"
              title="Refresh queue"
            >
              <RefreshCw size={16} className={queueLoading ? 'animate-spin' : ''} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            title="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'queue' ? (
          <div>
            {queueLoading && (
              <div className="flex items-center justify-center py-4">
                <RefreshCw size={20} className="animate-spin text-green-500" />
                <span className="ml-2 text-gray-400">Loading queue...</span>
              </div>
            )}
            
            {queueError && (
              <div className="bg-red-900/20 border border-red-800 rounded p-3 mb-4">
                <p className="text-red-400 text-sm">{queueError}</p>
                <button 
                  onClick={debouncedRefresh}
                  className="text-red-300 hover:text-red-100 text-xs mt-2 underline"
                >
                  Try again
                </button>
              </div>
            )}

            <div className="mb-4">
              <div className="text-xs text-gray-400 mb-1">Currently Playing</div>
              {currentTrack ? (
                renderTrackRow(currentTrack, -1, context.uri || (playlistId ? `spotify:playlist:${playlistId}` : undefined))
              ) : (
                <div className="text-gray-500">No track playing</div>
              )}
            </div>
            
            <div className="mb-2 text-xs text-gray-400">
              Next from: {playlistName ? (
                context.id ? (
                  <Link 
                    href={`/${context.type}/${context.id}`} 
                    className="text-green-400 hover:underline"
                  >
                    {playlistName}
                  </Link>
                ) : (
                  <span className="text-green-400">{playlistName}</span>
                )
              ) : (
                <span className="text-gray-500">Unknown source</span>
              )}
              {context.type !== 'unknown' && (
                <span className="text-gray-500 ml-1">({context.type})</span>
              )}
            </div>
            
            <div className="space-y-2">
              {nextTracks.length > 0 ? (
                nextTracks.map((track: any, idx: number) =>
                  renderTrackRow(track, idx, context.uri || (playlistId ? `spotify:playlist:${playlistId}` : undefined))
                )
              ) : (
                <div className="text-gray-500">
                  {queueLoading ? 'Loading tracks...' : 'No tracks in queue'}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            {recentLoading && <div className="text-gray-400">Loading...</div>}
            {recentError && <div className="text-red-400">{recentError}</div>}
            {!recentLoading && !recentError && recent.length === 0 && (
              <div className="text-gray-400">No recently played tracks found.</div>
            )}
            <div className="space-y-2">
              {recent.map((item: any, idx: number) => {
                const track = item.track;
                const contextUri = item.context?.type && item.context?.uri ? item.context.uri : undefined;
                return renderTrackRow(track, idx, contextUri);
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 