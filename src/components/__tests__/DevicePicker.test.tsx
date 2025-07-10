import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import DevicePicker from '../DevicePicker';
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

describe('DevicePicker', () => {
  let store;
  const devices = [
    { id: '1', name: 'Web Player', type: 'Computer', is_active: true },
    { id: '2', name: 'iPhone', type: 'Smartphone', is_active: false },
  ];

  beforeEach(() => {
    store = mockStore({
      player: {
        devices,
        selectedDeviceId: '1',
        status: 'succeeded',
        error: null,
      },
    });
    store.dispatch = createDispatchMock();
  });

  it('lists devices and highlights the active one', () => {
    render(
      <Provider store={store}>
        <DevicePicker onClose={() => {}} />
      </Provider>
    );
    const webPlayerLi = screen.getByText('Web Player').closest('li');
    expect(webPlayerLi).toHaveClass('text-green-400');
    expect(screen.getByText('iPhone')).toBeInTheDocument();
  });

  it('dispatches transferPlayback on device click', () => {
    render(
      <Provider store={store}>
        <DevicePicker onClose={() => {}} />
      </Provider>
    );
    fireEvent.click(screen.getByText('iPhone'));
    expect(store.dispatch).toHaveBeenCalled();
  });
});