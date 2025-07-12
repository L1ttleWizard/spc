import React from 'react';
import LibraryProvider from '@/components/LibraryProvider';

export default function TestPlaylistPage() {
  return (
    <LibraryProvider>
      <main className="flex-1 overflow-y-auto p-8">
        <h1 className="text-4xl font-bold mb-4">Тестовая страница плейлиста</h1>
        <p className="text-neutral-400">Если вы видите эту страницу, значит роутинг работает!</p>
      </main>
    </LibraryProvider>
  );
} 