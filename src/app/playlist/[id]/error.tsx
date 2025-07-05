'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function PlaylistError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Playlist page error:', error);
  }, [error]);

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-4xl font-bold mb-4">Что-то пошло не так</h1>
        <p className="text-neutral-400 mb-8">
          Произошла ошибка при загрузке плейлиста. Попробуйте еще раз.
        </p>
        <div className="flex gap-4">
          <button
            onClick={reset}
            className="bg-green-500 text-black font-bold py-3 px-8 rounded-full text-lg hover:bg-green-600"
          >
            Попробовать снова
          </button>
          <Link 
            href="/" 
            className="bg-neutral-700 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-neutral-600"
          >
            Вернуться на главную
          </Link>
        </div>
      </div>
    </main>
  );
} 