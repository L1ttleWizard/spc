// src/components/AuthInitializer.tsx

"use client"; 

import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { setUser } from '@/redux/slices/userSlice';


export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  
  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        
        dispatch(
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          })
        );
      } else {
        
        dispatch(setUser(null));
      }
    });

   
    return () => unsubscribe();
  }, [dispatch]);

  return <>{children}</>;
}