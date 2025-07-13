'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { getSpotifyTokens } from '@/lib/firebase';

export function SpotifyTokenManager() {
  const user = useSelector((state: RootState) => state.user.user);

  useEffect(() => {
    console.log('🔑 SpotifyTokenManager: useEffect triggered', { 
      hasUser: !!user, 
      userId: user?.uid,
      userStatus: user ? 'authenticated' : 'not authenticated'
    });

    const retrieveAndSetTokens = async () => {
      if (!user?.uid) {
        console.log('🔑 SpotifyTokenManager: No user UID available, skipping token retrieval');
        return;
      }

      console.log('🔑 SpotifyTokenManager: Starting token retrieval for user:', user.uid);

      try {
        // Check if we already have tokens in cookies by making a request to the session endpoint
        try {
          console.log('🔑 SpotifyTokenManager: Checking current session...');
          const sessionResponse = await fetch('/api/auth/session');
          if (sessionResponse.ok) {
            const data = await sessionResponse.json();
            console.log('🔑 SpotifyTokenManager: Session check result:', data);
            if (data.authenticated) {
              console.log('🔑 SpotifyTokenManager: Already authenticated, skipping Firestore retrieval');
              return; // Already authenticated
            }
          }
        } catch (error) {
          console.log('🔑 SpotifyTokenManager: Session check failed, proceeding with Firestore retrieval:', error);
        }

        // Retrieve tokens from Firestore
        try {
          console.log('🔑 SpotifyTokenManager: Retrieving tokens from Firestore for user:', user.uid);
          const tokens = await getSpotifyTokens(user.uid);
          
          if (tokens) {
            console.log('✅ Retrieved Spotify tokens from Firestore, setting cookies...', {
              hasAccessToken: !!tokens.accessToken,
              hasRefreshToken: !!tokens.refreshToken,
              expiresAt: new Date(tokens.expiresAt).toISOString()
            });
            
            // Set cookies with the retrieved tokens using a server endpoint
            const response = await fetch('/api/auth/set-tokens', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresIn: Math.floor((tokens.expiresAt - Date.now()) / 1000),
                userId: user.uid,
              }),
            });

            if (response.ok) {
              console.log('✅ Spotify tokens set from Firestore');
              // Reload the page to initialize the Spotify player with new tokens
              window.location.reload();
            } else {
              const errorData = await response.json();
              console.error('❌ Failed to set tokens from Firestore:', errorData);
            }
          } else {
            console.log('ℹ️ No stored Spotify tokens found for user:', user.uid);
          }
        } catch (firestoreError) {
          console.log('ℹ️ Firestore not available or tokens not found, user needs to connect Spotify:', firestoreError);
          // Don't throw error, just let the user connect Spotify manually
        }
      } catch (error) {
        console.error('❌ Error retrieving Spotify tokens from Firestore:', error);
      }
    };

    retrieveAndSetTokens();
  }, [user?.uid]);

  // This component doesn't render anything
  return null;
} 