import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PlaylistCard from '../PlaylistCard';
import '@testing-library/jest-dom';

describe('PlaylistCard', () => {
  const playlist = {
    name: 'Test Playlist',
    uri: 'spotify:playlist:1',
    images: [{ url: 'cover.jpg' }],
  };

  it('renders playlist name and image', () => {
    render(<PlaylistCard playlist={playlist} onClick={jest.fn()} />);
    expect(screen.getByText('Test Playlist')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'cover.jpg');
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<PlaylistCard playlist={playlist} onClick={onClick} />);
    fireEvent.click(screen.getByText('Test Playlist'));
    expect(onClick).toHaveBeenCalled();
  });
});