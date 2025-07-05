"use client";

import { useState, useEffect } from 'react';

export const useSession = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          setAccessToken(data.accessToken);
        } else {
          setAccessToken(null);
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, []);

  return { accessToken, isLoading };
};