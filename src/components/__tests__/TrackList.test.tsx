import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TrackList from '../TrackList';
import '@testing-library/jest-dom';

describe('TrackList', () => {
  const tracks = [
    { id: '1', name: 'Track 1', artists: [{ name: 'Artist 1' }], album: { name: 'Album 1', images: [{ url: '' }] }, duration_ms: 100000, uri: 'uri1' },
    { id: '2', name: 'Track 2', artists: [{ name: 'Artist 2' }], album: { name: 'Album 2', images: [{ url: '' }] }, duration_ms: 200000, uri: 'uri2' },
  ];

  it('renders a list of tracks', () => {
    render(<TrackList tracks={tracks} onTrackClick={jest.fn()} />);
    expect(screen.getByText('Track 1')).toBeInTheDocument();
    expect(screen.getByText('Track 2')).toBeInTheDocument();
  });

  it('calls onTrackClick when a track is clicked', () => {
    const onTrackClick = jest.fn();
    render(<TrackList tracks={tracks} onTrackClick={onTrackClick} />);
    fireEvent.click(screen.getByText('Track 1'));
    expect(onTrackClick).toHaveBeenCalledWith(tracks[0], 0);
  });
});