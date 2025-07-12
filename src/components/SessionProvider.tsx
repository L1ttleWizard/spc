"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SessionContextType {
  accessToken: string | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      console.log('🔄 SessionProvider: Fetching session...');
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          console.log('✅ SessionProvider: Session fetched successfully', { hasToken: !!data.accessToken });
          setAccessToken(data.accessToken);
        } else {
          console.log('❌ SessionProvider: Session fetch failed', response.status);
          setAccessToken(null);
        }
      } catch (error) {
        console.error('❌ SessionProvider: Failed to fetch session:', error);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, []);

  const contextValue: SessionContextType = {
    accessToken,
    isLoading,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
} 