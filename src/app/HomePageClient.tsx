"use client";

import React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectUser, selectUserStatus } from '@/redux/slices/userSlice';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';
import Link from 'next/link';
import Image from 'next/image';
import HorizontalScrollContainer from '@/components/HorizontalScrollContainer';

type UserPlaylist = SpotifyApi.PlaylistObjectSimplified;
type SavedAlbum = SpotifyApi.SavedAlbumObject;
type NewReleaseAlbum = SpotifyApi.AlbumObjectSimplified;

interface HomePageClientProps {
  playlists: UserPlaylist[] | null;
  albums: SavedAlbum[] | null;
  newReleases: NewReleaseAlbum[] | null;
}

export default function HomePageClient({ playlists, albums, newReleases }: HomePageClientProps) {
  const user = useSelector(selectUser);
  const status = useSelector(selectUserStatus);
  const router = useRouter();
  useSpotifyPlayer();
  
  useEffect(() => {
    if (status === 'loading') return;
    if (!user) router.replace('/login');
  }, [user, status, router]);

  if (status === 'loading' || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  const isSpotifyConnected = !!(playlists || albums || newReleases);

  return (
    <div className="p-6 space-y-8 w-full">
      {/* Отладка плеера */}
      
      
        {!isSpotifyConnected ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-2xl font-bold mb-4">Подключите ваш аккаунт Spotify</h2>
            <p className="text-neutral-400 mb-8">Чтобы слушать музыку и видеть ваши плейлисты.</p>
          <Link href="/api/auth/login" className="bg-green-500 text-black font-bold py-3 px-8 rounded-full text-lg hover:bg-green-600 transition-colors">
              Подключить Spotify
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-6">Добрый вечер!</h1>

          <div className="space-y-8">
            {newReleases && newReleases.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 overflow-x-clip">Новые релизы</h2>
                <HorizontalScrollContainer>
                {newReleases.map((album) => (
                    <div key={album.id} className="flex-shrink-0 w-48 min-w-0 overflow-visible">
                      <Link href={`/album/${album.id}`} className="bg-neutral-800 p-4 rounded-lg hover:bg-neutral-700 transition-all duration-300 hover-lift cursor-pointer block">
                      <div className="relative w-full aspect-square mb-3">
                        {album.images?.[0]?.url ? (
                          <Image 
                            src={album.images[0].url} 
                            alt={album.name} 
                            fill
                            className="object-cover rounded-md transition-transform duration-300"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
                          />
                        ) : (
                          <div className="w-full h-full bg-neutral-700 rounded-md flex items-center justify-center">
                            <span className="text-neutral-400 text-sm">Нет изображения</span>
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-white truncate hover:underline">{album.name}</h3>
                      <p className="text-sm text-neutral-400 truncate">{album.artists.map(a => a.name).join(', ')}</p>
                      </Link>
                    </div>
                ))}
                </HorizontalScrollContainer>
              </div>
            )}

            {playlists && playlists.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 overflow-x-clip">Плейлисты</h2>
                <HorizontalScrollContainer>
                    {playlists.map((playlist) => (
                    <div key={playlist.id} className="flex-shrink-0 w-48 min-w-0 overflow-visible">
                      <Link href={`/playlist/${playlist.id}`} className="bg-neutral-800 p-4 rounded-lg hover:bg-neutral-700 transition-all duration-300 hover-lift cursor-pointer block">
                      <div className="relative w-full aspect-square mb-3">
                        {playlist.images?.[0]?.url ? (
                          <Image 
                            src={playlist.images[0].url} 
                            alt={playlist.name} 
                            fill
                            className="object-cover rounded-md transition-transform duration-300 "
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
                          />
                        ) : (
                          <div className="w-full h-full bg-neutral-700 rounded-md flex items-center justify-center">
                            <span className="text-neutral-400 text-sm">Нет изображения</span>
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-white truncate  hover:underline">{playlist.name}</h3>
                      <p className="text-sm text-neutral-400 truncate">{playlist.description}</p>
                      </Link>
                    </div>
                    ))}
                </HorizontalScrollContainer>
              </div>
            )}

            {albums && albums.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 overflow-x-clip">Сохраненные альбомы</h2>
                <HorizontalScrollContainer>
                    {albums.map(({ album }) => (
                    <div key={album.id} className="flex-shrink-0 w-48 min-w-0 overflow-visible">
                      <Link href={`/album/${album.id}`} className="bg-neutral-800 p-4 rounded-lg hover:bg-neutral-700 transition-all duration-300 hover-lift cursor-pointer block">
                      <div className="relative w-full aspect-square mb-3">
                        {album.images?.[0]?.url ? (
                          <Image 
                            src={album.images[0].url} 
                            alt={album.name} 
                            fill
                            className="object-cover rounded-md transition-transform duration-300"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
                          />
                        ) : (
                          <div className="w-full h-full bg-neutral-700 rounded-md flex items-center justify-center">
                            <span className="text-neutral-400 text-sm">Нет изображения</span>
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-white truncate hover:underline">{album.name}</h3>
                      <p className="text-sm text-neutral-400 truncate">{album.artists.map(a => a.name).join(', ')}</p>
                      </Link>
                    </div>
                    ))}
                </HorizontalScrollContainer>
              </div>
            )}
          </div>
          </>
        )}
      </div>
  );
}