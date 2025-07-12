"use client";

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getQueue } from '@/redux/thunks/playerThunks';
import { useSession } from '@/hooks/useSession';
import { RootState, AppDispatch } from '@/redux/store';

export function PlayerDebug() {
  const dispatch = useDispatch<AppDispatch>();
  const { accessToken } = useSession();
  const { currentTrack, isPlaying, repeatMode, shuffle, queue, queueStatus } = useSelector((state: RootState) => state.player);

  useEffect(() => {
    if (accessToken && isPlaying) {
      // Fetch queue every 5 seconds when playing
      const interval = setInterval(() => {
        dispatch(getQueue({ accessToken, deviceId: undefined }));
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [accessToken, isPlaying, dispatch]);

  if (!isPlaying) return null;

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Player Debug</h3>
      <div className="space-y-1">
        <div>Current Track: {currentTrack?.name || 'None'}</div>
        <div>Repeat Mode: {repeatMode}</div>
        <div>Shuffle: {shuffle ? 'On' : 'Off'}</div>
        <div>Queue Status: {queueStatus}</div>
        <div>Queue Length: {queue?.queue?.length || 0}</div>
        <div>Currently Playing: {queue?.currently_playing?.name || 'None'}</div>
        {queue?.queue && queue.queue.length > 0 && (
          <div>
            <div className="font-semibold mt-2">Next in Queue:</div>
            {queue.queue.slice(0, 3).map((item, index) => (
              <div key={index} className="text-gray-300">
                {index + 1}. {item.name} - {item.artists[0]?.name}
              </div>
            ))}
            {queue.queue.length > 3 && (
              <div className="text-gray-400">... and {queue.queue.length - 3} more</div>
            )}
          </div>
        )}
        {queue?.queue && queue.queue.length === 0 && (
          <div className="text-gray-400">No tracks in queue</div>
        )}
      </div>
    </div>
  );
} 