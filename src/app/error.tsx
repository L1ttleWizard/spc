'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('❌ Global error caught:', error);
  }, [error]);

  const isAuthError = error.message.includes('authentication') || 
                     error.message.includes('unauthorized') ||
                     error.message.includes('401') ||
                     error.message.includes('access token') ||
                     error.message.includes('authentication_required');

  const isNotFoundError = error.message.includes('not found') ||
                         error.message.includes('404');

  const isLikedSongsError = error.message.includes('failed_to_load_liked_songs');

  if (isAuthError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-white mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-300 mb-6">
            Please log in to access this content.
          </p>
          <Link 
            href="/login"
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium transition-colors"
          >
            Connect Spotify
          </Link>
        </div>
      </div>
    );
  }

  if (isLikedSongsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-white mb-4">
            Unable to Load Liked Songs
          </h1>
          <p className="text-gray-300 mb-6">
            There was an issue loading your liked songs. This might be due to authentication issues or API limitations.
          </p>
          <div className="space-x-4">
            <Link 
              href="/"
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium transition-colors"
            >
              Go Home
            </Link>
            <button
              onClick={reset}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-full font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isNotFoundError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-white mb-4">
            Content Not Found
          </h1>
          <p className="text-gray-300 mb-6">
            The content you're looking for doesn't exist or you don't have access to it.
          </p>
          <div className="space-x-4">
            <Link 
              href="/"
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium transition-colors"
            >
              Go Home
            </Link>
            <button
              onClick={reset}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-full font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-white mb-4">
          Something went wrong!
        </h1>
        <p className="text-gray-300 mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <div className="space-x-4">
          <Link 
            href="/"
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium transition-colors"
          >
            Go Home
          </Link>
          <button
            onClick={reset}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-full font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
} 