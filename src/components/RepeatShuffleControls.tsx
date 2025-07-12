"use client";

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setRepeatMode, setShuffle, selectQueue, selectSelectedDeviceId } from '@/redux/slices/playerSlice';
import { setRepeatMode as setRepeatModeThunk, setShuffleMode } from '@/redux/thunks/playerThunks';
import { RootState } from '@/redux/store';
import { Repeat, Repeat1, Shuffle, Loader2 } from 'lucide-react';
import { useSession } from '@/hooks/useSession';

export default function RepeatShuffleControls() {
  const dispatch = useDispatch();
  const { accessToken } = useSession();
  const { repeatMode: reduxRepeatMode, shuffle: reduxShuffle } = useSelector((state: RootState) => state.player);
  const queue = useSelector(selectQueue);
  const selectedDeviceId = useSelector(selectSelectedDeviceId);
  
  // Local state for immediate UI feedback
  const [localRepeatMode, setLocalRepeatMode] = useState<'off' | 'context' | 'track'>('off');
  const [localShuffle, setLocalShuffle] = useState(false);
  const [isRepeatLoading, setIsRepeatLoading] = useState(false);
  const [isShuffleLoading, setIsShuffleLoading] = useState(false);

  // Sync local state with Redux state (but only when not loading)
  useEffect(() => {
    if (!isRepeatLoading) {
      setLocalRepeatMode(reduxRepeatMode);
    }
  }, [reduxRepeatMode, isRepeatLoading]);

  useEffect(() => {
    if (!isShuffleLoading) {
      setLocalShuffle(reduxShuffle);
    }
  }, [reduxShuffle, isShuffleLoading]);

  // Debug logging
  console.log('🔄 RepeatShuffleControls render:', { 
    localRepeatMode, 
    reduxRepeatMode,
    localShuffle, 
    reduxShuffle,
    accessToken: !!accessToken,
    selectedDeviceId,
    isRepeatLoading,
    isShuffleLoading,
    queueLength: queue?.queue?.length || 0
  });

  const handleRepeatClick = async () => {
    console.log('🔄 Repeat button clicked!', { currentMode: localRepeatMode, isRepeatLoading });
    
    if (isRepeatLoading) {
      console.log('⚠️ Repeat button is already loading, ignoring click');
      return;
    }
    
    const nextMode: 'off' | 'context' | 'track' = 
      localRepeatMode === 'off' ? 'context' : 
      localRepeatMode === 'context' ? 'track' : 'off';
    
    console.log('🔄 Setting repeat mode to:', nextMode);
    
    // Update local state immediately for instant UI feedback
    setLocalRepeatMode(nextMode);
    setIsRepeatLoading(true);
    
    // Call Spotify API in the background
    if (accessToken) {
      try {
        console.log('🔄 Calling Spotify API to set repeat mode...');
        await dispatch(setRepeatModeThunk({ 
          accessToken, 
          state: nextMode,
          deviceId: selectedDeviceId || undefined 
        })).unwrap();
        console.log('✅ Repeat mode set to:', nextMode);
        
        // Update Redux state after successful API call
        dispatch(setRepeatMode(nextMode));
      } catch (error) {
        console.error('❌ Failed to set repeat mode:', error);
        // Revert local state on error
        console.log('🔄 Reverting repeat mode to:', reduxRepeatMode);
        setLocalRepeatMode(reduxRepeatMode);
        // Show error feedback (you could add a toast notification here)
      } finally {
        setIsRepeatLoading(false);
      }
    } else {
      console.log('⚠️ No access token, skipping API call');
      setIsRepeatLoading(false);
    }
  };

  const handleShuffleClick = async () => {
    console.log('🔄 Shuffle button clicked!', { currentShuffle: localShuffle, isShuffleLoading });
    
    if (isShuffleLoading) {
      console.log('⚠️ Shuffle button is already loading, ignoring click');
      return;
    }
    
    const newShuffleState = !localShuffle;
    
    console.log('🔄 Setting shuffle mode to:', newShuffleState);
    
    // Update local state immediately for instant UI feedback
    setLocalShuffle(newShuffleState);
    setIsShuffleLoading(true);
    
    // Call Spotify API in the background
    if (accessToken) {
      try {
        console.log('🔄 Calling Spotify API to set shuffle mode...');
        await dispatch(setShuffleMode({ 
          accessToken, 
          state: newShuffleState,
          deviceId: selectedDeviceId || undefined 
        })).unwrap();
        console.log('✅ Shuffle mode set to:', newShuffleState);
        
        // Update Redux state after successful API call
        dispatch(setShuffle(newShuffleState));
      } catch (error) {
        console.error('❌ Failed to set shuffle mode:', error);
        // Revert local state on error
        console.log('🔄 Reverting shuffle mode');
        setLocalShuffle(!newShuffleState);
        // Show error feedback (you could add a toast notification here)
      } finally {
        setIsShuffleLoading(false);
      }
    } else {
      console.log('⚠️ No access token, skipping API call');
      setIsShuffleLoading(false);
    }
  };

  const getRepeatIcon = () => {
    if (isRepeatLoading) {
      return <Loader2 size={20} className="text-green-500 animate-spin" />;
    }
    
    switch (localRepeatMode) {
      case 'off':
        return <Repeat size={20} className="text-neutral-400" />;
      case 'context':
        return <Repeat size={20} className="text-green-500" />;
      case 'track':
        return <Repeat1 size={20} className="text-green-500" />;
      default:
        return <Repeat size={20} className="text-neutral-400" />;
    }
  };

  const getRepeatTooltip = () => {
    if (isRepeatLoading) return 'Setting repeat mode...';
    
    switch (localRepeatMode) {
      case 'off':
        return 'No repeat';
      case 'context':
        return 'Repeat all';
      case 'track':
        return 'Repeat one';
      default:
        return 'No repeat';
    }
  };

  const getShuffleIcon = () => {
    if (isShuffleLoading) {
      return <Loader2 size={20} className="text-green-500 animate-spin" />;
    }
    
    return (
      <Shuffle 
        size={20} 
        className={localShuffle ? 'text-green-500' : 'text-neutral-400'} 
      />
    );
  };

  const getShuffleTooltip = () => {
    if (isShuffleLoading) return 'Setting shuffle mode...';
    return localShuffle ? 'Shuffle on' : 'Shuffle off';
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Repeat Button */}
      <button
        onClick={handleRepeatClick}
        disabled={isRepeatLoading}
        className={`
          p-1 rounded transition-all duration-200
          ${isRepeatLoading 
            ? 'bg-green-500/20 cursor-not-allowed' 
            : 'hover:bg-neutral-800 hover:scale-105 active:scale-95'
          }
          ${localRepeatMode !== 'off' ? 'animate-pulse' : ''}
        `}
        title={getRepeatTooltip()}
      >
        {getRepeatIcon()}
      </button>

      {/* Shuffle Button */}
      <button
        onClick={handleShuffleClick}
        disabled={isShuffleLoading}
        className={`
          p-1 rounded transition-all duration-200
          ${isShuffleLoading 
            ? 'bg-green-500/20 cursor-not-allowed' 
            : 'hover:bg-neutral-800 hover:scale-105 active:scale-95'
          }
          ${localShuffle ? 'animate-pulse' : ''}
        `}
        title={getShuffleTooltip()}
      >
        {getShuffleIcon()}
      </button>
    </div>
  );
} 