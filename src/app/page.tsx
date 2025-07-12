import { getMainContentData } from '@/data/spotify';
import LibraryProvider from '@/components/LibraryProvider';
import HomePageClient from './HomePageClient';
import { LibrarySortType, LibraryFilterType } from '@/types';
import { cookies } from 'next/headers';

export default async function Page({ searchParams }: {
  searchParams: Promise<{
    sort?: LibrarySortType;
    filter?: LibraryFilterType;
  }>
}) {
  const cookieStore = await cookies();
  const hasToken = cookieStore.has('spotify_access_token');

  // If no Spotify token, render the page with null data (will show "Connect Spotify" message)
  if (!hasToken) {
    console.log('🔑 No Spotify token found, showing connect Spotify message');
    return (
      <LibraryProvider>
        <HomePageClient playlists={null} albums={null} newReleases={null} />
      </LibraryProvider>
    );
  }

  // const params = await searchParams;
  // const sort = params.sort || 'recents';
  // const filter = params.filter || 'playlist';

  try {
    console.log('🎵 Fetching main content data...');
    const mainContentData = await getMainContentData();
    console.log('✅ Main content data fetched successfully:', {
      playlists: mainContentData.playlists?.length || 0,
      albums: mainContentData.albums?.length || 0,
      newReleases: mainContentData.newReleases?.length || 0
    });

    return (
      <LibraryProvider>
        <HomePageClient 
          playlists={mainContentData.playlists} 
          albums={mainContentData.albums}
          newReleases={mainContentData.newReleases}
        />
      </LibraryProvider>
    );
  } catch (error) {
    console.error('❌ Error loading page data:', error);
    
    // If there's an error fetching Spotify data, still render the page
    // The user will see the "Connect Spotify" message or can retry
    return (
      <LibraryProvider>
        <HomePageClient 
          playlists={null} 
          albums={null}
          newReleases={null}
        />
      </LibraryProvider>
    );
  }
}