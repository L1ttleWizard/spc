import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import DevicePicker from '../DevicePicker';
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

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      player: playerReducer
    },
    preloadedState: {
      player: {
        devices: [],
        selectedDeviceId: null,
        status: 'idle',
        isPlaying: false,
        currentTrack: null,
        positionMs: 0,
        volume: 0.5,
        isActive: false,
        likedTracks: [],
        ...initialState
      }
    }
  });
};

describe('DevicePicker', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders device picker with devices', () => {
    const mockDevices = [
      { id: 'device1', name: 'Test Device 1', type: 'Computer', is_active: true },
      { id: 'device2', name: 'Test Device 2', type: 'Smartphone', is_active: false }
    ];

    const store = createMockStore({
      devices: mockDevices,
      selectedDeviceId: 'device1'
    });

    render(
      <Provider store={store}>
        <DevicePicker onClose={mockOnClose} />
      </Provider>
    );

    expect(screen.getByText('Выберите устройство')).toBeInTheDocument();
    expect(screen.getByText('Test Device 1')).toBeInTheDocument();
    expect(screen.getByText('Test Device 2')).toBeInTheDocument();
  });

  it('highlights active device', () => {
    const mockDevices = [
      { id: 'device1', name: 'Test Device 1', type: 'Computer', is_active: true },
      { id: 'device2', name: 'Test Device 2', type: 'Smartphone', is_active: false }
    ];

    const store = createMockStore({
      devices: mockDevices,
      selectedDeviceId: 'device1'
    });

    render(
      <Provider store={store}>
        <DevicePicker onClose={mockOnClose} />
      </Provider>
    );

    const activeDevice = screen.getByText('Test Device 1').closest('li');
    expect(activeDevice).toHaveClass('bg-green-700/30');
  });

  it('dispatches transferPlayback on device click', async () => {
    const { transferPlayback } = require('../../redux/thunks/playerThunks');
    const mockDevices = [
      { id: 'device1', name: 'Test Device 1', type: 'Computer', is_active: true },
      { id: 'device2', name: 'Test Device 2', type: 'Smartphone', is_active: false }
    ];

    const store = createMockStore({
      devices: mockDevices,
      selectedDeviceId: 'device1'
    });

    render(
      <Provider store={store}>
        <DevicePicker onClose={mockOnClose} />
      </Provider>
    );

    const inactiveDevice = screen.getByText('Test Device 2').closest('li');
    fireEvent.click(inactiveDevice!);

    await waitFor(() => {
      expect(transferPlayback).toHaveBeenCalledWith({
        accessToken: 'mock-access-token',
        deviceId: 'device2'
      });
    });
  });

  it('auto-refreshes device list every 5 seconds', () => {
    const { fetchDevices } = require('../../redux/thunks/playerThunks');
    jest.useFakeTimers();

    const store = createMockStore();

    render(
      <Provider store={store}>
        <DevicePicker onClose={mockOnClose} />
      </Provider>
    );

    // Initial fetch
    expect(fetchDevices).toHaveBeenCalledWith('mock-access-token');

    // Fast-forward 5 seconds
    jest.advanceTimersByTime(5000);
    expect(fetchDevices).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it('closes on escape key', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <DevicePicker onClose={mockOnClose} />
      </Provider>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    const store = createMockStore({
      status: 'loading'
    });

    render(
      <Provider store={store}>
        <DevicePicker onClose={mockOnClose} />
      </Provider>
    );

    expect(screen.getByText('Загрузка устройств...')).toBeInTheDocument();
  });

  it('shows no devices message when no devices available', () => {
    const store = createMockStore({
      devices: [],
      status: 'succeeded'
    });

    render(
      <Provider store={store}>
        <DevicePicker onClose={mockOnClose} />
      </Provider>
    );

    expect(screen.getByText('Нет доступных устройств. Откройте Spotify на другом устройстве.')).toBeInTheDocument();
  });
});