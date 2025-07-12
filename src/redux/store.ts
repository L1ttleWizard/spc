/**
 * Redux store configuration
 */

import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import userReducer from './slices/userSlice';
import playerReducer from './slices/playerSlice';

// Configure the store with middleware
export const store = configureStore({
  reducer: {
    user: userReducer,
    player: playerReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['user.lastUpdate', 'player.lastUpdate'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Setup listeners for automatic refetching
setupListeners(store.dispatch);

// Infer types from the store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export a hook for easier usage
export type AppStore = typeof store;
