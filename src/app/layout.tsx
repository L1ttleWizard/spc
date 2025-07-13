import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ReduxProvider } from '@/redux/reduxProvider';
import { AuthInitializer } from '@/components/AuthInitializer';
import { SessionProvider } from '@/components/SessionProvider';
import { SpotifyPlayerProvider } from '@/components/SpotifyPlayerProvider';
import { SpotifyTokenManager } from '@/components/SpotifyTokenManager';
import { ConditionalPlayer } from '@/components/ConditionalPlayer';
import { PlayerDebug } from '@/components/PlayerDebug';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Spotify Clone',
  description: 'A Spotify clone built with Next.js',
};

// Suppress expected console errors in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    if (
      message.includes('Permissions policy violation') ||
      message.includes('unload is not allowed') ||
      message.includes('robustness level') ||
      message.includes('message channel closed') ||
      message.includes('check_scope') ||
      message.includes('melody/v1/check_scope') ||
      message.includes('401 (Unauthorized)') ||
      message.includes('403 (Forbidden)') ||
      message.includes('Failed to load resource') ||
      message.includes('the server responded with a status of 401') ||
      message.includes('the server responded with a status of 403') ||
      message.includes('No access token found') ||
      message.includes('No Spotify tokens found')
    ) {
      return; // Suppress expected errors
    }
    originalConsoleError.apply(console, args);
  };

  // Also suppress fetch errors for authentication endpoints
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      
      // Don't log 401/403 errors for authentication endpoints
      if ((response.status === 401 || response.status === 403) && 
          typeof args[0] === 'string' && 
          (args[0].includes('/api/auth/') || args[0].includes('/api/library') || args[0].includes('/api/liked-songs'))) {
        // Suppress these errors as they're expected when user hasn't connected Spotify
        return response;
      }
      
      return response;
    } catch (error) {
      // Don't log fetch errors for authentication endpoints
      if (typeof args[0] === 'string' && 
          (args[0].includes('/api/auth/') || args[0].includes('/api/library') || args[0].includes('/api/liked-songs'))) {
        throw error; // Re-throw without logging
      }
      throw error;
    }
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReduxProvider>
          <AuthInitializer>
            <SessionProvider>
              <SpotifyPlayerProvider>
                <SpotifyTokenManager />
                {children}
                <PlayerDebug />
                <ConditionalPlayer />
              </SpotifyPlayerProvider>
            </SessionProvider>
          </AuthInitializer>
        </ReduxProvider>
      </body>
    </html>
  );
}