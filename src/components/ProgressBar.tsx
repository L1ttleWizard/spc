"use client";

import React, { useState, useRef, useEffect } from 'react';

interface ProgressBarProps {
  value: number; // от 0 до 100
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMouseUp?: (e: React.MouseEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
  variant?: 'track' | 'volume'; // разные варианты для трека и громкости
}

export default function ProgressBar({ 
  value, 
  onChange, 
  onMouseUp, 
  disabled = false,
  className = "",
  variant = 'track'
}: ProgressBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ограничиваем значение от 0 до 100
  const clampedValue = Math.max(0, Math.min(100, value));

  // Вычисляем процент для заполнения
  const fillPercentage = `${clampedValue}%`;

  // Отслеживаем скролл для показа/скрытия слайдера
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true);
      
      // Очищаем предыдущий таймаут
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Скрываем слайдер через 2 секунды после остановки скролла
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 2000);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', handleScroll, { passive: true });
    window.addEventListener('touchmove', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleScroll);
      window.removeEventListener('touchmove', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Разные стили для разных вариантов
  const getStyles = () => {
    if (variant === 'volume') {
      return {
        track: 'bg-neutral-700/50 backdrop-blur-sm',
        fill: 'bg-white',
        thumb: 'bg-white',
        height: 'h-1.5', // Тонкая полоска
        thumbSize: 'w-3 h-3', // Маленький ползунок
        hoverHeight: 'h-2', // Увеличивается при наведении
        hoverThumbSize: 'w-4 h-4' // Увеличивается при наведении
      };
    }
    // Для трека используем зеленый цвет как в Spotify
    return {
      track: 'bg-neutral-700/50 backdrop-blur-sm',
      fill: 'bg-green-500',
      thumb: 'bg-white',
      height: 'h-1.5', // Тонкая полоска
      thumbSize: 'w-3 h-3', // Маленький ползунок
      hoverHeight: 'h-2', // Увеличивается при наведении
      hoverThumbSize: 'w-4 h-4' // Увеличивается при наведении
    };
  };

  const styles = getStyles();

  // Определяем, когда показывать слайдер
  const shouldShowSlider = isDragging || isHovered || isScrolling;

  return (
    <div 
      className={`relative w-full ${styles.height} ${styles.track} rounded-full overflow-hidden group transition-all duration-300 ease-out ${className} ${
        shouldShowSlider ? styles.hoverHeight : styles.height
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Заполненная часть с градиентом */}
      <div 
        className={`absolute top-0 left-0 h-full ${styles.fill} rounded-full transition-all duration-150 ease-out ${
          isDragging ? 'transition-none' : ''
        } ${
          variant === 'track' 
            ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-lg shadow-green-500/25' 
            : 'bg-gradient-to-r from-white/80 to-white shadow-lg shadow-white/25'
        }`}
        style={{ width: fillPercentage }}
      />
      
      {/* Скрытый input для взаимодействия */}
      <input
        ref={inputRef}
        type="range"
        min={0}
        max={100}
        step={0.1}
        value={clampedValue}
        onChange={onChange}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={(e) => {
          setIsDragging(false);
          onMouseUp?.(e);
        }}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={(e) => {
          setIsDragging(false);
          // Создаем синтетическое mouse событие для touch
          const syntheticEvent = {
            ...e,
            target: e.target,
            currentTarget: e.currentTarget,
            type: 'mouseup'
          } as unknown as React.MouseEvent<HTMLInputElement>;
          onMouseUp?.(syntheticEvent);
        }}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        style={{ 
          // Увеличиваем область клика
          padding: '8px 0',
          margin: '-8px 0'
        }}
      />
      
      {/* Ползунок с улучшенной стилизацией */}
      <div 
        className={`absolute top-1/2 ${shouldShowSlider ? styles.hoverThumbSize : styles.thumbSize} ${styles.thumb} rounded-full transform -translate-y-1/2 transition-all duration-300 ease-out ${
          isDragging 
            ? 'opacity-100 scale-150 shadow-xl shadow-black/50 ring-4 ring-white/20' 
            : shouldShowSlider 
              ? 'opacity-100 scale-110 shadow-lg shadow-black/30 ring-2 ring-white/10' 
              : 'opacity-0 scale-100'
        } ${
          variant === 'track' 
            ? 'bg-white shadow-lg shadow-black/20' 
            : 'bg-white shadow-lg shadow-black/20'
        }`}
        style={{ 
          left: `calc(${fillPercentage} - ${shouldShowSlider ? '8px' : '6px'})`,
          pointerEvents: 'none'
        }}
      />
      
      {/* Дополнительный эффект при перетаскивании */}
      {isDragging && (
        <div 
          className={`absolute top-1/2 ${styles.hoverThumbSize} rounded-full transform -translate-y-1/2 transition-all duration-300 ease-out ${
            variant === 'track' 
              ? 'bg-green-400/20 ring-8 ring-green-400/10' 
              : 'bg-white/20 ring-8 ring-white/10'
          }`}
          style={{ 
            left: `calc(${fillPercentage} - 8px)`,
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  );
} 