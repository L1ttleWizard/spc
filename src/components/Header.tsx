// src/components/Header.tsx

"use client"

import React from 'react';
import { Home, Search } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <header className="sticky top-0 z-10 p-4 flex items-center justify-center bg-neutral-900/70 backdrop-blur-sm">
      
      <div className="flex items-center gap-4">
        <Link href="/" className="text-white hover:text-green-500 transition-colors">
          <Home size={28} />
        </Link>
        <div className="relative w-full max-w-xs">
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" 
            size={20} 
          />
          <input
            type="text"
            placeholder="Что хотите послушать?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-neutral-800 rounded-full pl-10 pr-4 py-2 w-full text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Правая часть (пока оставим пустой, как ты и предложил) */}
      <div>
        {/* Здесь в будущем будут кнопки профиля, уведомлений и т.д. */}
      </div>
    </header>
  );
}