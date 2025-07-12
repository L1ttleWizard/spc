// src/components/Header.tsx

"use client"

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Home, Search } from 'lucide-react';
import Link from 'next/link';

const RECENT_SEARCHES_KEY = 'spc_recent_searches';

function getRecentSearches() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
  } catch {
    return [];
  }
}

function addRecentSearch(query: string) {
  if (typeof window === 'undefined') return;
  let searches = getRecentSearches();
  searches = searches.filter((q: string) => q !== query);
  searches.unshift(query);
  if (searches.length > 8) searches = searches.slice(0, 8);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
}

export default function Header() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showDropdown) setRecent(getRecentSearches());
  }, [showDropdown]);

  const handleFocus = () => setShowDropdown(true);
  const handleBlur = () => setTimeout(() => setShowDropdown(false), 150);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    console.log('🔍 Header: Submitting search:', search.trim());
    addRecentSearch(search.trim());
    const searchUrl = `/search?q=${encodeURIComponent(search.trim())}`;
    console.log('🔍 Header: Redirecting to:', searchUrl);
    router.push(searchUrl);
    setShowDropdown(false);
  };

  const handleRecentClick = (q: string) => {
    console.log('🔍 Header: Clicking recent search:', q);
    setSearch(q);
    addRecentSearch(q);
    const searchUrl = `/search?q=${encodeURIComponent(q)}`;
    console.log('🔍 Header: Redirecting to:', searchUrl);
    router.push(searchUrl);
    setShowDropdown(false);
  };

  return (
    <header className="sticky top-0 z-10 p-4 flex items-center justify-center bg-neutral-900/70 backdrop-blur-sm">
      
      <div className="flex items-center gap-4">
        <Link href="/" className="text-white hover:text-green-500 transition-colors">
          <Home size={28} />
        </Link>
        <form onSubmit={handleSubmit} className="relative w-full max-w-md ml-auto">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Search for songs, artists, albums..."
              className="w-full px-4 py-2 pl-10 rounded-full bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
              aria-label="Search"
            >
              <Search size={16} />
            </button>
          </div>
          {showDropdown && recent.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-neutral-900 rounded-lg shadow-lg border border-neutral-800 overflow-hidden">
              <div className="text-xs text-neutral-400 px-4 py-2">Recent searches</div>
              {recent.map((q) => (
                <button
                  key={q}
                  type="button"
                  onMouseDown={() => handleRecentClick(q)}
                  className="w-full text-left px-4 py-2 hover:bg-neutral-800 text-white truncate"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* Правая часть (пока оставим пустой, как ты и предложил) */}
      <div>
        {/* Здесь в будущем будут кнопки профиля, уведомлений и т.д. */}
      </div>
    </header>
  );
}