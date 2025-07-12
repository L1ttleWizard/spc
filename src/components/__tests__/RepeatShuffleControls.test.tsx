import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import playerReducer from '../../redux/slices/playerSlice';
import RepeatShuffleControls from '../RepeatShuffleControls';
import { useSession } from '../../hooks/useSession';

// Mock the useSession hook
jest.mock('../../hooks/useSession');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock the Redux thunks
jest.mock('../../redux/thunks/playerThunks', () => ({
  togglePlayPause: { 
    fulfilled: { type: 'player/togglePlayPause/fulfilled' },
    pending: { type: 'player/togglePlayPause/pending' }
  },
  startPlayback: { 
    fulfilled: { type: 'player/startPlayback/fulfilled' },
    pending: { type: 'player/startPlayback/pending' }
  },
  changeVolume: { 
    fulfilled: { type: 'player/changeVolume/fulfilled' },
    pending: { type: 'player/changeVolume/pending' }
  },
  seekToPosition: { 
    fulfilled: { type: 'player/seekToPosition/fulfilled' },
    pending: { type: 'player/seekToPosition/pending' }
  },
  skipToPrevious: { 
    fulfilled: { type: 'player/skipToPrevious/fulfilled' },
    pending: { type: 'player/skipToPrevious/pending' }
  },
  skipToNext: { 
    fulfilled: { type: 'player/skipToNext/fulfilled' },
    pending: { type: 'player/skipToNext/pending' }
  },
  getMyCurrentPlaybackState: { 
    fulfilled: { type: 'player/getMyCurrentPlaybackState/fulfilled' },
    pending: { type: 'player/getMyCurrentPlaybackState/pending' }
  },
  fetchDevices: { 
    fulfilled: { type: 'player/fetchDevices/fulfilled' },
    pending: { type: 'player/fetchDevices/pending' }
  },
  likeTrack: { 
    fulfilled: { type: 'player/likeTrack/fulfilled' },
    pending: { type: 'player/likeTrack/pending' }
  },
  unlikeTrack: { 
    fulfilled: { type: 'player/unlikeTrack/fulfilled' },
    pending: { type: 'player/unlikeTrack/pending' }
  },
  fetchLikedTracks: { 
    fulfilled: { type: 'player/fetchLikedTracks/fulfilled' },
    pending: { type: 'player/fetchLikedTracks/pending' }
  },
  setRepeatMode: jest.fn(() => Promise.resolve({ unwrap: () => Promise.resolve() })),
  setShuffleMode: jest.fn(() => Promise.resolve({ unwrap: () => Promise.resolve() })),
}));

describe('RepeatShuffleControls', () => {
  const createMockStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        player: playerReducer,
      },
      preloadedState: {
        player: {
          isPlaying: false,
          currentTrack: null,
          positionMs: 0,
          volume: 0.5,
          isActive: false,
          status: 'idle',
          devices: [],
          selectedDeviceId: null,
          likedTracks: [],
          repeatMode: 'off',
          shuffle: false,
          ...initialState,
        },
      },
    });
  };

  beforeEach(() => {
    mockUseSession.mockReturnValue({
      accessToken: 'mock-token',
      user: null,
      loading: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders repeat and shuffle buttons', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <RepeatShuffleControls />
      </Provider>
    );

    expect(screen.getByTitle('No repeat')).toBeInTheDocument();
    expect(screen.getByTitle('Shuffle off')).toBeInTheDocument();
  });

  it('cycles through repeat modes correctly', async () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <RepeatShuffleControls />
      </Provider>
    );

    const repeatButton = screen.getByTitle('No repeat');

    // First click: off -> context
    fireEvent.click(repeatButton);
    await waitFor(() => {
      expect(screen.getByTitle('Repeat all')).toBeInTheDocument();
    });

    // Second click: context -> track
    fireEvent.click(repeatButton);
    await waitFor(() => {
      expect(screen.getByTitle('Repeat one')).toBeInTheDocument();
    });

    // Third click: track -> off
    fireEvent.click(repeatButton);
    await waitFor(() => {
      expect(screen.getByTitle('No repeat')).toBeInTheDocument();
    });
  });

  it('toggles shuffle correctly', async () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <RepeatShuffleControls />
      </Provider>
    );

    const shuffleButton = screen.getByTitle('Shuffle off');

    // First click: off -> on
    fireEvent.click(shuffleButton);
    await waitFor(() => {
      expect(screen.getByTitle('Shuffle on')).toBeInTheDocument();
    });

    // Second click: on -> off
    fireEvent.click(shuffleButton);
    await waitFor(() => {
      expect(screen.getByTitle('Shuffle off')).toBeInTheDocument();
    });
  });

  it('shows correct icons for different repeat modes', () => {
    const store = createMockStore({ repeatMode: 'context' });
    
    render(
      <Provider store={store}>
        <RepeatShuffleControls />
      </Provider>
    );

    expect(screen.getByTitle('Repeat all')).toBeInTheDocument();
  });

  it('shows correct icons for shuffle state', () => {
    const store = createMockStore({ shuffle: true });
    
    render(
      <Provider store={store}>
        <RepeatShuffleControls />
      </Provider>
    );

    expect(screen.getByTitle('Shuffle on')).toBeInTheDocument();
  });

  it('handles missing access token gracefully', async () => {
    mockUseSession.mockReturnValue({
      accessToken: null,
      user: null,
      loading: false,
    });

    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <RepeatShuffleControls />
      </Provider>
    );

    const repeatButton = screen.getByTitle('No repeat');
    fireEvent.click(repeatButton);

    // Should still update local state even without access token
    await waitFor(() => {
      expect(screen.getByTitle('Repeat all')).toBeInTheDocument();
    });
  });
}); 