import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PlaylistCard from '../PlaylistCard';
import '@testing-library/jest-dom';

describe('PlaylistCard', () => {
  const props = {
    name: 'Test Playlist',
    description: 'A test playlist',
    imageUrl: 'cover.jpg',
    id: '1',
  };

  it('renders playlist name and image', () => {
    render(<PlaylistCard {...props} />);
    expect(screen.getByText('Test Playlist')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'cover.jpg');
  });

  it('calls link when clicked', () => {
    render(<PlaylistCard {...props} />);
    fireEvent.click(screen.getByText('Test Playlist'));
    // No onClick, but should navigate via Link
    expect(window.location.pathname).toContain('/playlist/1');
  });
});