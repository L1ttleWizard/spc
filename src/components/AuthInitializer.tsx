// src/components/AuthInitializer.tsx

"use client"; 

import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { setUser, setLoading, setError } from '@/redux/slices/userSlice';

// Helper function to extract only the necessary user properties
// This prevents issues with Firebase user object circular references in Redux
const extractUserProperties = (firebaseUser: unknown) => {
  // Use Firebase's toJSON() method if available, otherwise extract manually
  if (firebaseUser.toJSON && typeof firebaseUser.toJSON === 'function') {
    const userData = firebaseUser.toJSON();
    return {
      uid: userData.uid,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      emailVerified: userData.emailVerified,
      providerData: userData.providerData,
    };
  }
  
  // Fallback manual extraction
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    emailVerified: firebaseUser.emailVerified,
    providerData: firebaseUser.providerData,
  };
};

// Create a promise that resolves when auth state is determined
const createAuthPromise = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      unsubscribe(); // Only listen once
      resolve(firebaseUser);
    });
  });
};

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    console.log('🔐 AuthInitializer: Starting auth initialization');
    
    // Set loading state when starting auth check
    dispatch(setLoading());
    
    // Create auth promise with timeout
    const authPromise = createAuthPromise();
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.warn('⚠️ AuthInitializer: Timeout reached, forcing null user');
        resolve(null);
      }, 10000); // 10 second timeout
    });
    
    // Race between auth promise and timeout
    Promise.race([authPromise, timeoutPromise])
      .then((firebaseUser: unknown) => {
        console.log('🔐 AuthInitializer: Auth state determined', { 
          hasUser: !!firebaseUser, 
          uid: firebaseUser?.uid 
        });
        
        if (firebaseUser) {
          const userData = extractUserProperties(firebaseUser);
          console.log('🔐 AuthInitializer: Dispatching user data', userData);
          dispatch(setUser(userData));
        } else {
          console.log('🔐 AuthInitializer: No user found, dispatching null');
          dispatch(setUser(null));
        }
        
        setIsInitialized(true);
      })
      .catch((error) => {
        console.error('❌ AuthInitializer: Error during auth initialization', error);
        dispatch(setError(error.message));
        dispatch(setUser(null));
        setIsInitialized(true);
      });
  }, [dispatch]);

  // Show loading while auth is being determined
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}