import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ReduxProvider } from '@/redux/reduxProvider';
import { AuthInitializer } from '@/components/AuthInitializer';
import { SessionProvider } from '@/components/SessionProvider';
import { SpotifyPlayerProvider } from '@/components/SpotifyPlayerProvider';
import { Player } from '@/components/Player';
import { PlayerDebug } from '@/components/PlayerDebug';

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
            <SessionProvider>
              <SpotifyPlayerProvider>
                {children}
                <PlayerDebug />
                <div className="h-24 flex-shrink-0">
                  <Player />
                </div>
              </SpotifyPlayerProvider>
            </SessionProvider>
          </AuthInitializer>
        </ReduxProvider>
      </body>
    </html>
  );
}