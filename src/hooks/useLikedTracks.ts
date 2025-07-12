// src/hooks/useLikedTracks.ts

"use client";

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLikedTracks } from '@/redux/thunks/playerThunks';
import { selectPlayerState } from '@/redux/slices/playerSlice';
import { useSession } from '@/hooks/useSession';
import { AppDispatch } from '@/redux/store';

export function useLikedTracks() {
  const dispatch = useDispatch<AppDispatch>();
  const { accessToken } = useSession();
  const { likedTracks } = useSelector(selectPlayerState);

  useEffect(() => {
    if (accessToken && likedTracks.length === 0) {
      dispatch(fetchLikedTracks(accessToken));
    }
  }, [accessToken, dispatch, likedTracks.length]);

  return {
    likedTracks,
    isLoading: false, // You can add loading state if needed
  };
} 