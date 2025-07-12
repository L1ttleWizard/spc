import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import RecentTracksRow from '../RecentTracks';
import '@testing-library/jest-dom';

jest.mock('@/hooks/useSession', () => ({
  useSession: () => ({
    accessToken: 'mock-token',
    isLoading: false,
    error: null,
    refresh: jest.fn(),
  }),
}));

const mockStore = configureStore([]);

function createDispatchMock() {
  const promise = Promise.resolve();
  promise.unwrap = () => Promise.resolve();
  return jest.fn(() => promise);
}

describe('RecentTracks like/unlike', () => {
  let store;
  const tracks = [
    {
      id: '1',
      uri: 'spotify:track:1',
      name: 'Test Track',
      duration_ms: 200000,
      artists: [{ name: 'Artist', uri: 'spotify:artist:1' }],
      album: { name: 'Album', uri: 'spotify:album:1', images: [{ url: '' }] },
      played_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    store = mockStore({
      player: {
        likedTracks: ['1'],
      },
    });
    store.dispatch = createDispatchMock();
  });

  it('dispatches unlikeTrack on click if liked', () => {
    render(
      <Provider store={store}>
        <RecentTracksRow tracks={tracks} />
      </Provider>
    );
    const likeBtn = screen.getByLabelText('Unlike');
    fireEvent.click(likeBtn);
    expect(store.dispatch).toHaveBeenCalled();
  });
});