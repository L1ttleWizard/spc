"use client";

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalScrollContainerProps {
  children: ReactNode;
  className?: string;
  showScrollIndicators?: boolean;
}

export default function HorizontalScrollContainer({
  children,
  className = "",
  showScrollIndicators = true
}: HorizontalScrollContainerProps) {
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Проверяем, нужно ли показывать индикаторы скролла
  const checkScrollIndicators = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftIndicator(scrollLeft > 0);
    setShowRightIndicator(scrollLeft < scrollWidth - clientWidth - 1);
  };

  // Обработчик скролла
  const handleScroll = () => {
    setIsScrolling(true);
    checkScrollIndicators();

    // Очищаем предыдущий таймаут
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Скрываем индикатор скролла через 2 секунды
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 2000);
  };

  // Скролл влево
  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
  };

  // Скролл вправо
  const scrollRight = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  };

  useEffect(() => {
    checkScrollIndicators();
    window.addEventListener('resize', checkScrollIndicators);
    
    return () => {
      window.removeEventListener('resize', checkScrollIndicators);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative group ${className}`}>
      {/* Контейнер с горизонтальным скроллом */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`flex gap-4 overflow-x-auto w-full scrollbar-hide pl-1 pr-6 overflow-x-clip`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {children}
      </div>

      {/* Индикаторы скролла */}
      {showScrollIndicators && (
        <>
          {/* Левая кнопка */}
          {showLeftIndicator && (
            <button
              onClick={scrollLeft}
              className={`absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/90 hover:bg-black text-white rounded-full flex items-center justify-center transition-all duration-300 ease-out shadow-lg backdrop-blur-sm z-30 ${
                isScrolling ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'
              }`}
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* Правая кнопка */}
          {showRightIndicator && (
            <button
              onClick={scrollRight}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/90 hover:bg-black text-white rounded-full flex items-center justify-center transition-all duration-300 ease-out shadow-lg backdrop-blur-sm z-30 ${
                isScrolling ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'
              }`}
            >
              <ChevronRight size={20} />
            </button>
          )}
        </>
      )}

      {/* Градиентные края удалены */}
    </div>
  );
} 