"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SessionContextType {
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        
        if (response.ok && data.authenticated) {
          setAccessToken(data.accessToken);
          setIsAuthenticated(true);
        } else {
          setAccessToken(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        // Don't log fetch errors as they're expected when user hasn't connected Spotify
        setAccessToken(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, []);

  const contextValue: SessionContextType = {
    accessToken,
    isLoading,
    isAuthenticated,
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