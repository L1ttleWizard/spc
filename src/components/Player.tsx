"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSession } from '@/hooks/useSession';
import { selectPlayerState, setVolumeState } from '@/redux/slices/playerSlice';
import { togglePlayPause, changeVolume, seekToPosition, skipToPrevious, skipToNext, startPlayback } from '@/redux/thunks/playerThunks';
import { AppDispatch } from '@/redux/store';
import { Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, ListMusic, Laptop2, Volume1, Volume2, VolumeX, Heart } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import useDebounce from '@/hooks/useDebounce';
import ProgressBar from './ProgressBar';

export default function Player() {
  const { accessToken } = useSession();
  const dispatch = useDispatch<AppDispatch>();
  const playerState = useSelector(selectPlayerState);
  const { isActive, isPlaying, currentTrack, volume, position, error } = playerState;

  const [currentPosition, setCurrentPosition] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [lastPlayedTrack, setLastPlayedTrack] = useState<{
    id: string;
    uri: string;
    name: string;
    duration_ms: number;
    artists: { name: string; uri: string }[];
    album: {
      name: string;
      uri: string;
      images: { url: string }[];
    };
    timestamp: number;
  } | null>(null);
  
  const debouncedVolume = useDebounce(volume, 500);

  // Получаем последний прослушанный трек из localStorage
  useEffect(() => {
    const stored = localStorage.getItem('lastPlayedTrack');
    if (stored) {
      try {
        setLastPlayedTrack(JSON.parse(stored));
      } catch (e) {
        console.error('Ошибка парсинга последнего трека:', e);
      }
    }
  }, []);

  // Сохраняем текущий трек как последний прослушанный
  useEffect(() => {
    if (currentTrack) {
      const trackData = {
        ...currentTrack,
        timestamp: Date.now()
      };
      localStorage.setItem('lastPlayedTrack', JSON.stringify(trackData));
      setLastPlayedTrack(trackData);
    }
  }, [currentTrack]);

  useEffect(() => {
    // console.log('Player State:', {
    //   isActive,
    //   isPlaying,
    //   hasTrack: !!currentTrack,
    //   volume,
    //   position,
    //   currentPosition,
    //   volumePercent: Math.round(volume * 100),
    //   trackProgress: currentTrack ? Math.round((currentPosition / currentTrack.duration_ms) * 100) : 0,
    //   hasAccessToken: !!accessToken,
    //   hasLastPlayedTrack: !!lastPlayedTrack
    // });
  }, [isActive, isPlaying, currentTrack, volume, position, currentPosition, accessToken, lastPlayedTrack]);

  useEffect(() => {
    if (!isSeeking) {
        setCurrentPosition(position);
    }
  }, [position, isSeeking]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !isSeeking) {
        interval = setInterval(() => {
            setCurrentPosition(prev => prev + 1000);
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isSeeking]);

  useEffect(() => {
    if (accessToken && debouncedVolume !== null && isActive) {
      const volumePercent = Math.round(
        (debouncedVolume ** 2) * 100
      );
      dispatch(changeVolume({ accessToken, volumePercent }));
    }
  }, [debouncedVolume, accessToken, dispatch, isActive]);

  const handlePlayPause = useCallback(() => {
    if (!accessToken) return;
    
    if (!isActive && lastPlayedTrack) {
      // Если плеер неактивен, но есть последний трек, запускаем его
      dispatch(startPlayback({ accessToken, trackUris: [lastPlayedTrack.uri] }));
    } else if (isActive) {
      dispatch(togglePlayPause(accessToken));
    }
  }, [dispatch, accessToken, isActive, lastPlayedTrack]);

  const handleSkipToPrevious = useCallback(() => {
    if (!accessToken || !isActive) {
      // console.log('Skip to previous: неактивно или нет токена');
      return;
    }
    // console.log('Переключаем на предыдущий трек');
    dispatch(skipToPrevious(accessToken));
  }, [dispatch, accessToken, isActive]);

  const handleSkipToNext = useCallback(() => {
    if (!accessToken || !isActive) {
      // console.log('Skip to next: неактивно или нет токена');
      return;
    }
    // console.log('Переключаем на следующий трек');
    dispatch(skipToNext(accessToken));
  }, [dispatch, accessToken, isActive]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value) / 100;
    dispatch(setVolumeState(newVolume));
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentTrack) return;
    setIsSeeking(true);
    const newPosition = (parseInt(e.target.value) / 100) * currentTrack.duration_ms;
    setCurrentPosition(newPosition);
  };
  
  const handleSeekUp = (e: React.MouseEvent<HTMLInputElement>) => {
    if (!accessToken || !currentTrack) return;
    setIsSeeking(false);
    const newPositionMs = (parseInt((e.target as HTMLInputElement).value) / 100) * currentTrack.duration_ms;
    dispatch(seekToPosition({ accessToken, positionMs: Math.round(newPositionMs) }));
  };
  
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  // Определяем какой трек показывать
  const displayTrack = currentTrack || lastPlayedTrack;
  const isLastPlayedTrack = !currentTrack && lastPlayedTrack;

  return (
    <>
      {error && (
        <div className="fixed bottom-28 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in">
          {error}
        </div>
      )}
      <footer className="h-24 bg-black border-t border-neutral-800 text-white p-4 flex items-center justify-between">
      <div className="flex items-center gap-3 w-1/4 min-w-[180px]">
        {displayTrack ? (
          <>
            <img src={displayTrack.album.images[0]?.url} alt={displayTrack.name} className="w-14 h-14 rounded-md" />
            <div>
              <p className={`font-semibold hover:underline cursor-pointer truncate ${isLastPlayedTrack ? 'text-neutral-400' : ''}`}>
                {displayTrack.name}
              </p>
              <p className="text-xs text-neutral-400 truncate">{displayTrack.artists.map((a: { name: string; uri: string }) => a.name).join(', ')}</p>
            </div>
            <button className="text-neutral-400 hover:text-white"><Heart size={18} /></button>
          </>
        ) : (
          <div className="w-14 h-14" />
        )}
      </div>

      <div className="flex flex-col items-center gap-2 w-1/2 max-w-2xl">
        <div className="flex items-center gap-4 text-neutral-400">
          <button disabled={!isActive} className="hover:text-white disabled:text-neutral-700 disabled:cursor-not-allowed"><Shuffle size={18} /></button>
          <button onClick={handleSkipToPrevious} disabled={!isActive} className="hover:text-white disabled:text-neutral-700 disabled:cursor-not-allowed"><SkipBack size={20} /></button>
          <button onClick={handlePlayPause} disabled={!accessToken} className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 disabled:bg-neutral-600 disabled:cursor-not-allowed">
            {isPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" />}
          </button>
          <button onClick={handleSkipToNext} disabled={!isActive} className="hover:text-white disabled:text-neutral-700 disabled:cursor-not-allowed"><SkipForward size={20} /></button>
          <button disabled={!isActive} className="hover:text-white disabled:text-neutral-700 disabled:cursor-not-allowed"><Repeat size={18} /></button>
        </div>
        <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-neutral-400 w-10 text-right">{formatTime(currentPosition)}</span>
            <ProgressBar 
              variant="track" 
              value={displayTrack ? (currentPosition / displayTrack.duration_ms) * 100 : 0} 
              onChange={handleSeekChange} 
              onMouseUp={handleSeekUp} 
              disabled={!isActive} 
            />
            <span className="text-xs text-neutral-400 w-10">
              {displayTrack ? formatTime(displayTrack.duration_ms) : '0:00'}
            </span>
        </div>
      </div>
      
      <div className="flex items-center justify-end gap-3 w-1/4">
        <button className="hover:text-white"><ListMusic size={18} /></button>
        <button className="hover:text-white"><Laptop2 size={18} /></button>
        <div className="flex items-center gap-2 w-24">
          <button className="hover:text-white"><VolumeIcon size={18} /></button>
          <ProgressBar variant="volume" value={volume * 100} onChange={handleVolumeChange} disabled={!isActive}/>
        </div>
      </div>
    </footer>
    </>
  );
}