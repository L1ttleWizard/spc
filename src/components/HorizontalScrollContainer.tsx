"use client";

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalScrollContainerProps {
  children: ReactNode;
  className?: string;
  showScrollIndicators?: boolean;
  autoHideScrollbar?: boolean;
}

export default function HorizontalScrollContainer({
  children,
  className = "",
  showScrollIndicators = true,
  autoHideScrollbar = true
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
        className={` overflow-hidden flex gap-4  ${
          autoHideScrollbar 
            ? 'scrollbar-hide hover:scrollbar-default' 
            : ''
        } ${
          isScrolling 
            ? 'scrollbar-default' 
            : 'scrollbar-hide'
        } transition-all duration-300 ease-out`}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: isScrolling ? '#52525b' : 'transparent'
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
              className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/80 hover:bg-black text-white rounded-full flex items-center justify-center transition-all duration-300 ease-out shadow-lg backdrop-blur-sm ${
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
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/80 hover:bg-black text-white rounded-full flex items-center justify-center transition-all duration-300 ease-out shadow-lg backdrop-blur-sm ${
                isScrolling ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'
              }`}
            >
              <ChevronRight size={20} />
            </button>
          )}
        </>
      )}

      {/* Градиентные края для лучшего UX */}
      {showLeftIndicator && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
      )}
      {showRightIndicator && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
      )}
    </div>
  );
} 