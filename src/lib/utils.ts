/**
 * Utility functions for the application
 */

import { VALIDATION } from '@/constants';

/**
 * Formats milliseconds to MM:SS format
 */
export function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) {
    return '0:00';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Validates and clamps volume value
 */
export function clampVolume(volume: number): number {
  return Math.max(VALIDATION.MIN_VOLUME, Math.min(VALIDATION.MAX_VOLUME, volume));
}

/**
 * Validates and clamps position value
 */
export function clampPosition(position: number, maxPosition: number): number {
  return Math.max(VALIDATION.MIN_POSITION, Math.min(maxPosition, position));
}

/**
 * Truncates text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength - 3)}...`;
}

/**
 * Checks if a URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Debounces a function call
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttles a function call
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Creates a delay promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safely parses JSON with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Generates a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Checks if we're in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Gets a safe display name for artists
 */
export function getArtistNames(artists: Array<{ name: string }>): string {
  if (!artists || artists.length === 0) {
    return 'Unknown Artist';
  }
  return artists.map(artist => artist.name).join(', ');
}

/**
 * Gets a safe image URL with fallback
 */
export function getImageUrl(images: Array<{ url: string }> | undefined, fallback?: string): string | undefined {
  if (!images || images.length === 0) {
    return fallback;
  }
  return images[0]?.url || fallback;
}

/**
 * Formats a number to a locale string
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

/**
 * Checks if a value is defined and not null
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for checking if an object has a specific property
 */
export function hasProperty<T extends PropertyKey>(
  obj: object,
  prop: T
): obj is Record<T, unknown> {
  return prop in obj;
}

/**
 * Creates a class name string from conditional classes
 */
export function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(' ');
}
