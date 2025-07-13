"use client";

import { useEffect, useRef } from 'react';

export function usePerformanceMonitor(componentName: string) {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(performance.now());

  useEffect(() => {
    renderCountRef.current += 1;
    const now = performance.now();
    const timeSinceLastRender = now - lastRenderTimeRef.current;
    lastRenderTimeRef.current = now;

    // Log if renders are happening too frequently
    if (timeSinceLastRender < 100) {
      console.warn(`⚠️ ${componentName} re-rendering too frequently: ${timeSinceLastRender.toFixed(2)}ms since last render (render #${renderCountRef.current})`);
    }

    // Log every 10th render to track frequency
    if (renderCountRef.current % 10 === 0) {
      console.log(`📊 ${componentName} render #${renderCountRef.current} (${timeSinceLastRender.toFixed(2)}ms since last)`);
    }
  });

  return {
    renderCount: renderCountRef.current,
    timeSinceLastRender: performance.now() - lastRenderTimeRef.current,
  };
} 