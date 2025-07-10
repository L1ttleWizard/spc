"use client";

import React from 'react';
import { Heart, Play } from 'lucide-react'; // Импортируем иконку Play
import { useDispatch, useSelector } from 'react-redux';
import { likeTrack } from '@/redux/thunks/playerThunks';
import { selectPlayerState } from '@/redux/slices/playerSlice';
import { useSession } from '@/hooks/useSession';
import { AppDispatch } from '@/redux/store';

interface RecentTrack {
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
  played_at: string;
}

interface RecentTracksRowProps {
  tracks: RecentTrack[];
  onPlayTrack?: (trackUri: string) => void;
}

export default function RecentTracksRow({ tracks, onPlayTrack }: RecentTracksRowProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { likedTracks } = useSelector(selectPlayerState);
  const { accessToken } = useSession();

  const getCardType = (track: RecentTrack) => {
    if (track.id === 'liked-songs') return 'liked';
    return 'album';
  };

  return (
    <section className="w-full mb-8">
      <div className="flex items-center justify-between mb-4 px-6">
        {/* Заголовок выглядит лучше на одной строке, как в Spotify */}
        <h2 className="text-2xl font-bold text-white">Recently played</h2>
        <button className="text-sm font-bold text-neutral-400 hover:underline">
          Show all
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 px-6">
        {/* Использование grid вместо flex для лучшей адаптивности */}
        {tracks.map((track) => {
          const cardType = getCardType(track);
          const isLiked = likedTracks?.includes(track.id);
          return (
            // Обертка для карточки, которая обрабатывает клик
            <div
              key={track.id + track.played_at}
              className="group relative p-4 bg-neutral-900 hover:bg-neutral-800 transition-colors duration-300 rounded-lg cursor-pointer"
              onClick={() => onPlayTrack?.(track.album?.uri || track.uri)} // Воспроизводим альбом или трек
            >
              <div className="relative w-full mb-4">
                {/* Контейнер для изображения и кнопки Play */}
                {cardType === 'liked' ? (
                  <div className="w-full aspect-square rounded-md shadow-lg bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center">
                    <Heart size={48} fill="white" stroke="white" />
                  </div>
                ) : (
                  <img
                    src={track.album.images?.[0]?.url || '/placeholder-playlist.png'}
                    alt={track.name}
                    className="w-full aspect-square object-cover rounded-md shadow-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-playlist.png';
                    }}
                  />
                )}

                {/* Heart button for each track except 'liked-songs' */}
                {cardType !== 'liked' && (
                  <button
                    aria-label={isLiked ? 'Unlike' : 'Like'}
                    className={`absolute top-2 right-2 z-10 bg-black/60 rounded-full p-2 hover:text-white ${isLiked ? 'text-green-500' : 'text-neutral-400'}`}
                    onClick={e => {
                      e.stopPropagation();
                      if (accessToken) {
                        dispatch(likeTrack({ accessToken, trackId: track.id }));
                      }
                    }}
                  >
                    <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" />
                  </button>
                )}

                {/* Кнопка Play появляется при наведении */}
                <div className="absolute bottom-2 right-2 transition-all duration-300 ease-in-out opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Предотвращаем клик по родительской карточке
                      onPlayTrack?.(track.uri); // Воспроизводим конкретный трек
                    }}
                    className="bg-green-500 rounded-full p-3 shadow-lg flex items-center justify-center hover:scale-105"
                    aria-label={`Play ${track.name}`}
                  >
                    <Play fill="black" className="text-black" />
                  </button>
                </div>
              </div>

              {/* Информация о треке */}
              <div className="flex flex-col">
                <span className="text-white font-bold truncate w-full">
                  {track.name}
                </span>
                <span className="text-neutral-400 text-sm truncate w-full">
                  {track.artists.map((artist) => artist.name).join(', ')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}