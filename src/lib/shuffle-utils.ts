/**
 * Advanced shuffle utilities for music player
 * Based on research from: https://github.com/fluxrider/playlist_shuffle
 */

export interface ShuffleState {
  originalOrder: string[];
  shuffledOrder: string[];
  currentIndex: number;
  totalCount: number;
}

/**
 * Fisher-Yates shuffle algorithm
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Two Interlaced Shuffles algorithm
 * This provides better variance than simple shuffle while maintaining
 * the property that no song repeats until all others have played
 */
export function twoInterlacedShuffles(tracks: string[]): string[] {
  if (tracks.length <= 1) return tracks;
  
  const n = tracks.length;
  const half = Math.floor(n / 2);
  
  // Random interlace size between 1 and quarter of the array
  const interlaceSize = Math.floor(Math.random() * Math.floor(n / 4)) + 1;
  
  // Create two halves with interlace, ensuring no overlap
  const firstHalf = tracks.slice(0, half);
  const secondHalf = tracks.slice(half);
  
  // Shuffle each half independently
  const shuffledFirst = fisherYatesShuffle(firstHalf);
  const shuffledSecond = fisherYatesShuffle(secondHalf);
  
  // Combine the halves
  return [...shuffledFirst, ...shuffledSecond];
}

/**
 * Initialize shuffle state for a playlist
 */
export function initializeShuffle(tracks: string[]): ShuffleState {
  if (tracks.length === 0) {
    return {
      originalOrder: [],
      shuffledOrder: [],
      currentIndex: 0,
      totalCount: 0
    };
  }
  
  return {
    originalOrder: [...tracks],
    shuffledOrder: twoInterlacedShuffles(tracks),
    currentIndex: 0,
    totalCount: tracks.length
  };
}

/**
 * Get next track in shuffle order
 */
export function getNextShuffledTrack(state: ShuffleState): string | null {
  if (state.shuffledOrder.length === 0) return null;
  
  const track = state.shuffledOrder[state.currentIndex];
  const nextIndex = (state.currentIndex + 1) % state.shuffledOrder.length;
  
  // If we've reached the end, reshuffle for next cycle
  if (nextIndex === 0) {
    state.shuffledOrder = twoInterlacedShuffles(state.originalOrder);
  }
  
  state.currentIndex = nextIndex;
  return track;
}

/**
 * Get previous track in shuffle order
 */
export function getPreviousShuffledTrack(state: ShuffleState): string | null {
  if (state.shuffledOrder.length === 0) return null;
  
  const prevIndex = state.currentIndex === 0 
    ? state.shuffledOrder.length - 1 
    : state.currentIndex - 1;
  
  state.currentIndex = prevIndex;
  return state.shuffledOrder[prevIndex];
}

/**
 * Set current track in shuffle order
 */
export function setCurrentShuffledTrack(state: ShuffleState, trackId: string): void {
  const index = state.shuffledOrder.indexOf(trackId);
  if (index !== -1) {
    state.currentIndex = index;
  }
}

/**
 * Reshuffle the current playlist
 */
export function reshuffle(state: ShuffleState): void {
  if (state.originalOrder.length > 0) {
    state.shuffledOrder = twoInterlacedShuffles(state.originalOrder);
    state.currentIndex = 0;
  }
} 