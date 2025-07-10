"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Player from './Player';
import { LibraryItem, LibrarySortType, LibraryFilterType } from '@/types';

interface AppLayoutProps {
  children: React.ReactNode;
  sidebarItems?: LibraryItem[] | null;
  currentSort?: LibrarySortType;
  currentFilter?: LibraryFilterType;
}

interface SidebarProps {
  items?: LibraryItem[] | null | undefined;
  currentSort?: LibrarySortType | undefined;
  currentFilter?: LibraryFilterType | undefined;
}

export default function AppLayout({ 
  children, 
  sidebarItems, 
  currentSort, 
  currentFilter 
}: AppLayoutProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Показываем загрузку на короткое время для плавности
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Индикатор загрузки */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-sm">Загрузка...</p>
          </div>
        </div>
      )}

      {/* Основной контент */}
      <div className="flex flex-1 overflow-hidden">
        {/* Сайдбар */}
        <Sidebar 
          items={sidebarItems as SidebarProps['items']}
          currentSort={currentSort as SidebarProps['currentSort']}
          currentFilter={currentFilter as SidebarProps['currentFilter']}
        />
        
        {/* Основная область */}
        <div className="flex-1 flex flex-col overflow-hidden md:ml-72">
          {/* Хедер */}
          <Header />
          
          {/* Контент страницы */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
      
      {/* Плеер внизу */}
      <div className="h-24 flex-shrink-0">
        <Player />
      </div>
    </div>
  );
} 