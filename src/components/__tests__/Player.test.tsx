import React from 'react';
import { render, fireEvent, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
jest.mock('@/hooks/useSession', () => ({
  useSession: () => ({
    accessToken: 'mock-token',
    isLoading: false,
    error: null,
    refresh: jest.fn(),
  }),
}));
// Silence img src empty string warning
let origConsoleError: typeof console.error;
beforeAll(() => {
  origConsoleError = console.error;
  jest.spyOn(console, 'error').mockImplementation((msg, ...args) => {
    if (typeof msg === 'string' && msg.includes('An empty string ("\") was passed to the src attribute')) return;
    return origConsoleError(msg, ...args);
  });
});
afterAll(() => {
  console.error = origConsoleError;
});
import Player from '../Player';
import '@testing-library/jest-dom';

const mockStore = configureStore([]);

function createDispatchMock() {
  const promise: any = Promise.resolve();
  promise.unwrap = () => Promise.resolve();
  return jest.fn(() => promise);
}

describe('Player Sliders', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      player: {
        isActive: true,
        isPlaying: true,
        currentTrack: {
          id: '1',
          uri: 'spotify:track:1',
          name: 'Test Track',
          duration_ms: 200000,
          artists: [{ name: 'Artist', uri: 'spotify:artist:1' }],
          album: { name: 'Album', uri: 'spotify:album:1', images: [{ url: '' }] }
        },
        volume: 0.5,
        position: 50000,
        status: 'idle',
        error: null,
        likedTracks: [],
      },
    });
    store.dispatch = createDispatchMock();
  });

  it('shows outlined heart if not liked', () => {
    render(
      <Provider store={store}>
        <Player />
      </Provider>
    );
    expect(within(screen.getByLabelText('like')).getByTestId('like-icon')).not.toHaveAttribute('fill', 'currentColor');
  });

  it('shows filled heart if liked', () => {
    store = mockStore({
      player: {
        ...store.getState().player,
        likedTracks: ['1'],
      },
    });
    store.dispatch = createDispatchMock();
    render(
      <Provider store={store}>
        <Player />
      </Provider>
    );
    expect(within(screen.getByLabelText('like')).getByTestId('like-icon')).toHaveAttribute('fill', 'currentColor');
  });

  it('dispatches likeTrack on click', () => {
    render(
      <Provider store={store}>
        <Player />
      </Provider>
    );
    const likeBtn = screen.getByLabelText('like');
    fireEvent.click(likeBtn);
    expect(store.dispatch).toHaveBeenCalled();
  });

  it('updates volume on slider change', () => {
    render(
      <Provider store={store}>
        <Player />
      </Provider>
    );
    const sliders = screen.getAllByRole('slider');
    const volumeSlider = sliders[1]; // Second slider is volume
    fireEvent.change(volumeSlider, { target: { value: '80' } });
    expect(store.dispatch).toHaveBeenCalled();
  });

  it('updates position on track progress slider change', () => {
    render(
      <Provider store={store}>
        <Player />
      </Provider>
    );
    const sliders = screen.getAllByRole('slider');
    const progressSlider = sliders[0]; // First slider is progress
    fireEvent.change(progressSlider, { target: { value: '60' } });
    fireEvent.mouseUp(progressSlider);
    expect(store.dispatch).toHaveBeenCalled();
  });

  it('disables sliders when not active', () => {
    store = mockStore({
      player: { ...store.getState().player, isActive: false }
    });
    store.dispatch = createDispatchMock();
    render(
      <Provider store={store}>
        <Player />
      </Provider>
    );
    const sliders = screen.getAllByRole('slider');
    sliders.forEach(slider => {
      expect(slider).toBeDisabled();
    });
  });
});