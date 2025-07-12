import { getLibraryData, getMainContentData } from '@/data/spotify';
import AppLayout from '@/components/AppLayout';
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

  if (!hasToken) {
    return (
      <AppLayout sidebarItems={null}>
          <HomePageClient playlists={null} albums={null} newReleases={null} />
      </AppLayout>
    );
  }

  const params = await searchParams;
  const sort = params.sort || 'recents';
  const filter = params.filter || 'playlist';

  try {
  const [sidebarData, mainContentData] = await Promise.all([
    getLibraryData(sort, filter),
    getMainContentData(),
  ]);

  return (
      <AppLayout 
        sidebarItems={sidebarData}
          currentSort={sort}
          currentFilter={filter}
      >
        <HomePageClient 
          playlists={mainContentData.playlists} 
          albums={mainContentData.albums}
          newReleases={mainContentData.newReleases}
        />
      </AppLayout>
    );
  } catch (error) {
    console.error('Error loading page data:', error);
    
    // Fallback с пустыми данными
    return (
      <AppLayout sidebarItems={[]}>
        <HomePageClient 
          playlists={null} 
          albums={null}
          newReleases={null}
        />
      </AppLayout>
  );
  }
}