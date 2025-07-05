export type LibrarySortType = 'recents' | 'added' | 'alpha' | 'creator';
export type LibraryFilterType = 'playlist' | 'album';

export type LibraryItem = {
  id: string;
  type: 'playlist' | 'album';
  name: string;
  imageUrl?: string;
  subtitle: string;
  creator: string;
  dateAdded: Date | null;
  lastPlayed: Date | null;
};