/**
 * Centralized error handling utilities
 */

import { ERROR_MESSAGES } from '@/constants';

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  PLAYER = 'PLAYER',
  API = 'API',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: unknown;
  context?: Record<string, unknown>;
}

export class SpotifyError extends Error {
  public readonly type: ErrorType;
  public readonly context?: Record<string, unknown>;
  public readonly originalError?: unknown;

  constructor(type: ErrorType, message: string, originalError?: unknown, context?: Record<string, unknown>) {
    super(message);
    this.name = 'SpotifyError';
    this.type = type;
    this.originalError = originalError;
    this.context = context;
  }
}

/**
 * Creates a standardized error object
 */
export function createError(
  type: ErrorType,
  message: string,
  originalError?: unknown,
  context?: Record<string, unknown>
): AppError {
  return {
    type,
    message,
    originalError,
    context,
  };
}

/**
 * Handles API errors and converts them to AppError format
 */
export async function handleApiError(error: unknown, context?: Record<string, unknown>): Promise<AppError> {
  if (error instanceof Response) {
    const status = error.status;
    let message = ERROR_MESSAGES.NETWORK_ERROR;

    try {
      const errorData = await error.json();
      message = errorData.error?.message || errorData.message || message;
    } catch {
      // If JSON parsing fails, use default message
    }

    if (status === 401) {
      return createError(ErrorType.AUTHENTICATION, ERROR_MESSAGES.SPOTIFY_AUTH_FAILED, error, context);
    } else if (status >= 400 && status < 500) {
      return createError(ErrorType.VALIDATION, message, error, context);
    } else if (status >= 500) {
      return createError(ErrorType.API, message, error, context);
    }

    return createError(ErrorType.NETWORK, message, error, context);
  }

  if (error instanceof Error) {
    return createError(ErrorType.UNKNOWN, error.message, error, context);
  }

  return createError(ErrorType.UNKNOWN, String(error), error, context);
}

/**
 * Logs errors with context
 */
export function logError(error: AppError): void {
  console.error('[SpotifyClone Error]', {
    type: error.type,
    message: error.message,
    context: error.context,
    originalError: error.originalError,
  });
}

/**
 * Handles errors with logging and optional user notification
 */
export function handleError(
  error: unknown,
  context?: Record<string, unknown>,
  shouldThrow = false
): AppError {
  const appError = error instanceof SpotifyError 
    ? { type: error.type, message: error.message, originalError: error.originalError, context: error.context }
    : createError(ErrorType.UNKNOWN, String(error), error, context);

  logError(appError);

  if (shouldThrow) {
    throw new SpotifyError(appError.type, appError.message, appError.originalError, appError.context);
  }

  return appError;
}

/**
 * Retry mechanism for failed operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000,
  context?: Record<string, unknown>
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }

      // Don't retry authentication errors
      if (error instanceof Response && error.status === 401) {
        break;
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw handleError(lastError, { ...context, attempts: maxRetries }, true);
}
