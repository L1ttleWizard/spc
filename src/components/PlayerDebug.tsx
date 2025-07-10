"use client";

import React from 'react';
import { useSelector } from 'react-redux';
import { selectPlayerState } from '@/redux/slices/playerSlice';
import { useSession } from '@/hooks/useSession';

export default function PlayerDebug(): JSX.Element {
  const { accessToken, isLoading } = useSession();
  const playerState = useSelector(selectPlayerState);

  if (isLoading) {
    return <div className="p-4 bg-yellow-100 text-yellow-800">Загрузка сессии...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 text-sm font-mono">
      <h3 className="font-bold mb-2">Отладка плеера:</h3>
      <div className="space-y-1">
        <div>Access Token: {accessToken ? '✅ Есть' : '❌ Нет'}</div>
        <div>Device ID: {playerState.deviceId || '❌ Нет'}</div>
        <div>Is Active: {playerState.isActive ? '✅ Да' : '❌ Нет'}</div>
        <div>Is Playing: {playerState.isPlaying ? '✅ Да' : '❌ Нет'}</div>
        <div>Current Track: {playerState.currentTrack ? `✅ ${playerState.currentTrack.name}` : '❌ Нет'}</div>
        <div>Volume: {Math.round(playerState.volume * 100)}%</div>
        <div>Position: {Math.round(playerState.position / 1000)}s</div>
        <div>Status: {playerState.status}</div>
      </div>
    </div>
  );
} 