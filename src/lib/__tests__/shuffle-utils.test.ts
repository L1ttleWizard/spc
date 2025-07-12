import {
  fisherYatesShuffle,
  twoInterlacedShuffles,
  initializeShuffle,
  getNextShuffledTrack,
  getPreviousShuffledTrack,
  setCurrentShuffledTrack,
  reshuffle,
  type ShuffleState,
} from '../shuffle-utils';

describe('Shuffle Utilities', () => {
  describe('fisherYatesShuffle', () => {
    it('should shuffle an array without losing elements', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = fisherYatesShuffle(original);
      
      expect(shuffled).toHaveLength(original.length);
      expect(shuffled.sort()).toEqual(original.sort());
    });

    it('should handle empty array', () => {
      const shuffled = fisherYatesShuffle([]);
      expect(shuffled).toEqual([]);
    });

    it('should handle single element array', () => {
      const shuffled = fisherYatesShuffle([1]);
      expect(shuffled).toEqual([1]);
    });
  });

  describe('twoInterlacedShuffles', () => {
    it('should shuffle an array with interlaced algorithm', () => {
      const original = ['a', 'b', 'c', 'd', 'e', 'f'];
      const shuffled = twoInterlacedShuffles(original);
      
      expect(shuffled).toHaveLength(original.length);
      expect(shuffled.sort()).toEqual(original.sort());
    });

    it('should handle arrays with odd number of elements', () => {
      const original = ['a', 'b', 'c', 'd', 'e'];
      const shuffled = twoInterlacedShuffles(original);
      
      expect(shuffled).toHaveLength(original.length);
      expect(shuffled.sort()).toEqual(original.sort());
    });

    it('should handle empty array', () => {
      const shuffled = twoInterlacedShuffles([]);
      expect(shuffled).toEqual([]);
    });

    it('should handle single element array', () => {
      const shuffled = twoInterlacedShuffles(['a']);
      expect(shuffled).toEqual(['a']);
    });
  });

  describe('initializeShuffle', () => {
    it('should initialize shuffle state correctly', () => {
      const tracks = ['track1', 'track2', 'track3'];
      const state = initializeShuffle(tracks);
      
      expect(state.originalOrder).toEqual(tracks);
      expect(state.shuffledOrder).toHaveLength(tracks.length);
      expect(state.currentIndex).toBe(0);
      expect(state.totalCount).toBe(tracks.length);
    });

    it('should handle empty array', () => {
      const state = initializeShuffle([]);
      
      expect(state.originalOrder).toEqual([]);
      expect(state.shuffledOrder).toEqual([]);
      expect(state.currentIndex).toBe(0);
      expect(state.totalCount).toBe(0);
    });
  });

  describe('getNextShuffledTrack', () => {
    it('should return next track in shuffle order', () => {
      const tracks = ['track1', 'track2', 'track3'];
      const state = initializeShuffle(tracks);
      
      const firstTrack = getNextShuffledTrack(state);
      expect(firstTrack).toBeDefined();
      expect(tracks).toContain(firstTrack);
      expect(state.currentIndex).toBe(1);
    });

    it('should cycle through all tracks', () => {
      const tracks = ['track1', 'track2', 'track3'];
      const state = initializeShuffle(tracks);
      
      const track1 = getNextShuffledTrack(state);
      const track2 = getNextShuffledTrack(state);
      const track3 = getNextShuffledTrack(state);
      
      expect([track1, track2, track3]).toHaveLength(3);
      expect(new Set([track1, track2, track3]).size).toBe(3);
    });

    it('should handle empty state', () => {
      const state: ShuffleState = {
        originalOrder: [],
        shuffledOrder: [],
        currentIndex: 0,
        totalCount: 0,
      };
      
      const track = getNextShuffledTrack(state);
      expect(track).toBeNull();
    });
  });

  describe('getPreviousShuffledTrack', () => {
    it('should return previous track in shuffle order', () => {
      const tracks = ['track1', 'track2', 'track3'];
      const state = initializeShuffle(tracks);
      
      // Move to second track first
      getNextShuffledTrack(state);
      
      const previousTrack = getPreviousShuffledTrack(state);
      expect(previousTrack).toBeDefined();
      expect(tracks).toContain(previousTrack);
      expect(state.currentIndex).toBe(0);
    });

    it('should wrap around to end when going back from first track', () => {
      const tracks = ['track1', 'track2', 'track3'];
      const state = initializeShuffle(tracks);
      
      const lastTrack = getPreviousShuffledTrack(state);
      expect(lastTrack).toBeDefined();
      expect(tracks).toContain(lastTrack);
      expect(state.currentIndex).toBe(tracks.length - 1);
    });
  });

  describe('setCurrentShuffledTrack', () => {
    it('should set current track index correctly', () => {
      const tracks = ['track1', 'track2', 'track3'];
      const state = initializeShuffle(tracks);
      
      setCurrentShuffledTrack(state, 'track2');
      expect(state.currentIndex).toBe(state.shuffledOrder.indexOf('track2'));
    });

    it('should handle track not found', () => {
      const tracks = ['track1', 'track2', 'track3'];
      const state = initializeShuffle(tracks);
      const originalIndex = state.currentIndex;
      
      setCurrentShuffledTrack(state, 'nonexistent');
      expect(state.currentIndex).toBe(originalIndex);
    });
  });

  describe('reshuffle', () => {
    it('should create new shuffle order', () => {
      const tracks = ['track1', 'track2', 'track3'];
      const state = initializeShuffle(tracks);
      const originalShuffle = [...state.shuffledOrder];
      
      reshuffle(state);
      
      expect(state.shuffledOrder).toHaveLength(tracks.length);
      expect(state.currentIndex).toBe(0);
      // The new shuffle should be different (though not guaranteed)
      expect(state.shuffledOrder).not.toEqual(originalShuffle);
    });

    it('should handle empty state', () => {
      const state: ShuffleState = {
        originalOrder: [],
        shuffledOrder: [],
        currentIndex: 0,
        totalCount: 0,
      };
      
      reshuffle(state);
      expect(state.shuffledOrder).toEqual([]);
      expect(state.currentIndex).toBe(0);
    });
  });
}); 