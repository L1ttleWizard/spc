"use client";

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { likeTrack, unlikeTrack } from '@/redux/thunks/playerThunks';
import { addLikedTrack, removeLikedTrack } from '@/redux/slices/playerSlice';
import { useSession } from '@/hooks/useSession';
import { AppDispatch, RootState } from '@/redux/store';

export function useLikeTrack() {
  const dispatch = useDispatch<AppDispatch>();
  const { accessToken } = useSession();
  const { likedTracks } = useSelector((state: RootState) => state.player);

  const isLiked = useCallback((trackId: string) => {
    return likedTracks.includes(trackId);
  }, [likedTracks]);

  const toggleLike = useCallback(async (trackId: string) => {
    if (!accessToken) {
      console.warn('❌ No access token for like/unlike operation');
      return;
    }

    if (!trackId || trackId === 'undefined') {
      console.warn('❌ Invalid track ID:', trackId);
      return;
    }

    try {
      const currentlyLiked = isLiked(trackId);
      
      if (currentlyLiked) {
        // Unlike the track
        console.log('💔 Unliking track:', trackId);
        await dispatch(unlikeTrack({ accessToken, trackId })).unwrap();
        dispatch(removeLikedTrack(trackId));
        console.log('✅ Track unliked successfully');
      } else {
        // Like the track
        console.log('❤️ Liking track:', trackId);
        await dispatch(likeTrack({ accessToken, trackId })).unwrap();
        dispatch(addLikedTrack(trackId));
        console.log('✅ Track liked successfully');
      }
    } catch (error) {
      console.error('❌ Error toggling like status:', error);
      // You could show a toast notification here
    }
  }, [accessToken, dispatch, isLiked]);

  return {
    isLiked,
    toggleLike,
    likedTracks,
  };
} 