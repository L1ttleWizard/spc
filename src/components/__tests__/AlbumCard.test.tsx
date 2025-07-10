import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AlbumCard from '../AlbumCard';
import '@testing-library/jest-dom';

describe('AlbumCard', () => {
  const album = {
    name: 'Test Album',
    uri: 'spotify:album:1',
    images: [{ url: 'cover.jpg' }],
  };

  it('renders album name and image', () => {
    render(<AlbumCard album={album} onClick={jest.fn()} />);
    expect(screen.getByText('Test Album')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'cover.jpg');
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<AlbumCard album={album} onClick={onClick} />);
    fireEvent.click(screen.getByText('Test Album'));
    expect(onClick).toHaveBeenCalled();
  });
});