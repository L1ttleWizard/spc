import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Player } from '../Player';
import playerReducer from '../../redux/slices/playerSlice';

// Mock the SpotifyPlayerProvider context
jest.mock('../SpotifyPlayerProvider', () => ({
  useSpotifyPlayerContext: () => ({
    isActive: true,
    currentTrack: {
      id: '1',
      name: 'Test Track',
      artists: [{ name: 'Test Artist' }],
      album: {
        images: [{ url: 'test-image.jpg' }]
      }
    },
    togglePlay: jest.fn(),
    nextTrack: jest.fn(),
    previousTrack: jest.fn(),
    setVolume: jest.fn(),
    error: null,
    clearError: jest.fn(),
  }),
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />;
  },
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

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      player: playerReducer,
    },
    preloadedState: {
      player: {
        isActive: true,
        currentTrack: {
          id: '1',
          name: 'Test Track',
          artists: [{ name: 'Test Artist' }],
          album: {
            images: [{ url: 'test-image.jpg' }]
          }
        },
        volume: 0.5,
        positionMs: 0,
        durationMs: 100000,
        likedTracks: [],
        devices: [],
        selectedDeviceId: null,
        ...initialState,
      },
    },
  });
};

const createDispatchMock = () => {
  return jest.fn();
};

describe('Player', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    store = createMockStore();
    store.dispatch = createDispatchMock();
  });

  it('renders player when active', () => {
    render(
      <Provider store={store}>
        <Player />
      </Provider>
    );
    
    expect(screen.getByText('Test Track')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  it('does not render when not active', () => {
    store = createMockStore({ isActive: false });
    
    const { container } = render(
      <Provider store={store}>
        <Player />
      </Provider>
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('shows error message when error exists', () => {
    const mockContext = {
      isActive: true,
      currentTrack: null,
      togglePlay: jest.fn(),
      nextTrack: jest.fn(),
      previousTrack: jest.fn(),
      setVolume: jest.fn(),
      error: 'Test error message',
      clearError: jest.fn(),
    };

    jest.doMock('../SpotifyPlayerProvider', () => ({
      useSpotifyPlayerContext: () => mockContext,
    }));

    render(
      <Provider store={store}>
        <Player />
      </Provider>
    );
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });
});