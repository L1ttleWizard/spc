import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import TrackList from '../TrackList';
import playerReducer from '../../redux/slices/playerSlice';

// Mock the session hook
jest.mock('../../hooks/useSession', () => ({
  useSession: () => ({
    accessToken: 'mock-access-token'
  })
}));

// Mock all async thunks used in the playerSlice
jest.mock('../../redux/thunks/playerThunks', () => ({
  fetchDevices: { fulfilled: 'fetchDevices/fulfilled' },
  transferPlayback: { fulfilled: 'transferPlayback/fulfilled' },
  togglePlayPause: { fulfilled: 'togglePlayPause/fulfilled' },
  startPlayback: { fulfilled: 'startPlayback/fulfilled' },
  changeVolume: { fulfilled: 'changeVolume/fulfilled' },
  seekToPosition: { fulfilled: 'seekToPosition/fulfilled' },
  getMyCurrentPlaybackState: { pending: 'getMyCurrentPlaybackState/pending', fulfilled: 'getMyCurrentPlaybackState/fulfilled' },
  skipToPrevious: { fulfilled: 'skipToPrevious/fulfilled' },
  skipToNext: { fulfilled: 'skipToNext/fulfilled' },
  playTrack: { fulfilled: 'playTrack/fulfilled' },
  playPlaylist: { fulfilled: 'playPlaylist/fulfilled' },
  likeTrack: { fulfilled: 'likeTrack/fulfilled' },
  unlikeTrack: { fulfilled: 'unlikeTrack/fulfilled' },
  fetchLikedTracks: { fulfilled: 'fetchLikedTracks/fulfilled' },
}));

const createMockStore = () => {
  return configureStore({
    reducer: {
      player: playerReducer,
    },
    preloadedState: {
      player: {
        isActive: false,
        currentTrack: null,
        volume: 0.5,
        positionMs: 0,
        durationMs: 100000,
        likedTracks: [],
        devices: [],
        selectedDeviceId: null,
      },
    },
  });
};

const mockTracks = [
  {
    id: '1',
    name: 'Test Track 1',
    artists: [{ name: 'Test Artist 1' }],
    album: { name: 'Test Album 1', images: [{ url: 'test1.jpg' }] },
    duration_ms: 180000,
  },
  {
    id: '2',
    name: 'Test Track 2',
    artists: [{ name: 'Test Artist 2' }],
    album: { name: 'Test Album 2', images: [{ url: 'test2.jpg' }] },
    duration_ms: 200000,
  },
];

describe('TrackList', () => {
  let store: ReturnType<typeof createMockStore>;
  const mockOnTrackClick = jest.fn();

  beforeEach(() => {
    store = createMockStore();
    mockOnTrackClick.mockClear();
  });

  it('renders a list of tracks', () => {
    render(
      <Provider store={store}>
        <TrackList tracks={mockTracks} onTrackClick={mockOnTrackClick} />
      </Provider>
    );

    expect(screen.getByText('Test Track 1')).toBeInTheDocument();
    expect(screen.getByText('Test Track 2')).toBeInTheDocument();
    expect(screen.getByText('Test Artist 1')).toBeInTheDocument();
    expect(screen.getByText('Test Artist 2')).toBeInTheDocument();
  });

  it('calls onTrackClick when a track is clicked', () => {
    render(
      <Provider store={store}>
        <TrackList tracks={mockTracks} onTrackClick={mockOnTrackClick} />
      </Provider>
    );

    const firstTrack = screen.getByText('Test Track 1');
    fireEvent.click(firstTrack);

    expect(mockOnTrackClick).toHaveBeenCalledWith(mockTracks[0]);
  });
});