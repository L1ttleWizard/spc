import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ReduxProvider } from '@/redux/reduxProvider';
import { AuthInitializer } from '@/components/AuthInitializer';
import { SpotifyPlayerProvider } from '@/components/SpotifyPlayerProvider';
import { Player } from '@/components/Player';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Spotify Clone',
  description: 'A Spotify clone built with Next.js',
};

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
            <SpotifyPlayerProvider>
              {children}
              <Player />
            </SpotifyPlayerProvider>
          </AuthInitializer>
        </ReduxProvider>
      </body>
    </html>
  );
}