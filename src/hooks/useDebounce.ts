/**
 * Debounce hook for delayed value updates
 */

import { useState, useEffect, useCallback } from 'react';
import { debounce } from '@/lib/utils';

/**
 * Hook that debounces a value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook that returns a debounced callback function
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  return useCallback(
    (...args: Parameters<T>) => debounce(callback, delay)(...args),
    [callback, delay]
  );
}

export default useDebounce;
