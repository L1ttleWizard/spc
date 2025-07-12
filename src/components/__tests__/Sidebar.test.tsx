import React from 'react';
import { render, screen } from '@testing-library/react';
import Sidebar from '../Sidebar';
import '@testing-library/jest-dom';
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));
import type { LibraryItem } from '@/types';

describe('Sidebar', () => {
  const items: LibraryItem[] = [
    { id: '1', type: 'playlist', name: 'My Playlist', subtitle: 'By Me', imageUrl: undefined, creator: 'Me', dateAdded: null, lastPlayed: null },
    { id: '2', type: 'album', name: 'My Album', subtitle: 'By Me', imageUrl: undefined, creator: 'Me', dateAdded: null, lastPlayed: null },
  ];

  it('renders items', () => {
    render(<Sidebar items={items} />);
    expect(screen.getByText('My Playlist')).toBeInTheDocument();
    expect(screen.getByText('My Album')).toBeInTheDocument();
  });

  it('renders filter and sort buttons', () => {
    render(<Sidebar items={items} />);
    expect(screen.getByText(/плейлисты/i)).toBeInTheDocument();
    expect(screen.getByText(/альбомы/i)).toBeInTheDocument();
  });
});