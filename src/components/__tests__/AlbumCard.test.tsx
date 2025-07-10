import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AlbumCard from '../AlbumCard';
import '@testing-library/jest-dom';

describe('AlbumCard', () => {
  const props = {
    name: 'Test Album',
    artist: 'Test Artist',
    imageUrl: 'cover.jpg',
    id: '1',
  };

  it('renders album name and image', () => {
    render(<AlbumCard {...props} />);
    expect(screen.getByText('Test Album')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'cover.jpg');
  });

  it('calls link when clicked', () => {
    render(<AlbumCard {...props} />);
    fireEvent.click(screen.getByText('Test Album'));
    // No onClick, but should navigate via Link
    expect(window.location.pathname).toContain('/album/1');
  });
});