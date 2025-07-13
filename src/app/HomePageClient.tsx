"use client";

import React from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import HorizontalScrollContainer from '@/components/HorizontalScrollContainer';
import NowPlayingCard from '@/components/NowPlayingCard';
import ArtistLink from '@/components/ArtistLink';
import { RootState } from '@/redux/store';

type UserPlaylist = SpotifyApi.PlaylistObjectSimplified;
type UserAlbum = SpotifyApi.SavedAlbumObject;
type NewRelease = SpotifyApi.AlbumObjectSimplified;

interface HomePageClientProps {
  playlists: UserPlaylist[] | null;
  albums: UserAlbum[] | null;
  newReleases: NewRelease[] | null;
}

export default function HomePageClient({ playlists, albums, newReleases }: HomePageClientProps) {
  const user = useSelector((state: RootState) => state.user.user);
  const userStatus = useSelector((state: RootState) => state.user.status);
  const userError = useSelector((state: RootState) => state.user.error);
  const router = useRouter();
  const [authTimeout, setAuthTimeout] = useState(false);
  
  console.log('🏠 HomePageClient:', { 
    hasFirebaseUser: !!user, 
    userId: user?.uid,
    userStatus,
    userError,
    playlists: playlists?.length, 
    albums: albums?.length, 
    newReleases: newReleases?.length 
  });
  
  // Set a timeout for auth loading to prevent infinite loading
  useEffect(() => {
    if (userStatus === 'loading') {
      const timer = setTimeout(() => {
        console.log('⚠️ Auth loading timeout, proceeding without Firebase auth');
        setAuthTimeout(true);
      }, 3000); // 3 second timeout
      
      return () => clearTimeout(timer);
    } else {
      setAuthTimeout(false);
    }
  }, [userStatus]);

  // Show loading only briefly while auth state is being determined
  const isLoading = userStatus === 'loading' && !authTimeout;

  useEffect(() => {
    // Only redirect if auth state is determined and user is null
    // Don't redirect if we're in timeout mode (Firebase not configured)
    if (userStatus !== 'loading' && user === null && !authTimeout) {
      console.log('🔐 No Firebase user, redirecting to login');
      router.replace('/login');
    }
  }, [user, userStatus, router, authTimeout]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your library...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is null and we're not in timeout mode (will redirect)
  if (user === null && !authTimeout) {
    return null;
  }

  // If there's an auth error, show error message
  if (userError && !authTimeout) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-4">Authentication error: {userError}</p>
          <button 
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // User is authenticated or we're in timeout mode, render the main content
  const isSpotifyConnected = !!(playlists || albums || newReleases);

  return (
    <div className="p-6 space-y-8 w-full">
      {/* Debug info */}
      {user && (
        <div className="text-sm text-gray-400 mb-4">
          Logged in as: {user.email} (ID: {user.uid})
        </div>
      )}
      
      {!isSpotifyConnected ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h2 className="text-2xl font-bold mb-4">Подключите ваш аккаунт Spotify</h2>
          <p className="text-neutral-400 mb-8">Чтобы слушать музыку и видеть ваши плейлисты.</p>
          <Link href="/api/auth/login" className="bg-green-500 text-black font-bold py-3 px-8 rounded-full text-lg hover:bg-green-600 transition-colors">
              Подключить Spotify
          </Link>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-6">Добрый вечер!</h1>

          {/* Now Playing Card */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Сейчас играет</h2>
            <NowPlayingCard />
          </div>

          <div className="space-y-8">
            {newReleases && newReleases.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 overflow-x-clip">Новые альбомы</h2>
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
                      <p className="text-sm text-neutral-400 truncate">
                        {album.artists.map((artist, index) => (
                          <React.Fragment key={artist.id}>
                            <ArtistLink artist={artist} className="text-neutral-400 hover:text-white">
                              {artist.name}
                            </ArtistLink>
                            {index < album.artists.length - 1 && ', '}
                          </React.Fragment>
                        ))}
                      </p>
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
                <h2 className="text-2xl font-bold mb-4 overflow-x-clip">Ваши альбомы</h2>
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
                      <p className="text-sm text-neutral-400 truncate">
                        {album.artists.map((artist, index) => (
                          <React.Fragment key={artist.id}>
                            <ArtistLink artist={artist} className="text-neutral-400 hover:text-white">
                              {artist.name}
                            </ArtistLink>
                            {index < album.artists.length - 1 && ', '}
                          </React.Fragment>
                        ))}
                      </p>
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