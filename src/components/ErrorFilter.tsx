"use client";

import { useEffect } from 'react';

export function ErrorFilter() {
  useEffect(() => {
    // Store original console methods
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleLog = console.log;

    // Filter function for permissions policy violations
    const shouldFilter = (message: unknown): boolean => {
      if (typeof message === 'string') {
        return message.includes('Permissions policy violation: unload is not allowed') ||
               message.includes('Permissions policy violation') ||
               message.includes('unload is not allowed');
      }
      return false;
    };

    // Override console.error
    console.error = (...args) => {
      if (shouldFilter(args[0])) {
        return; // Suppress the message
      }
      originalConsoleError.apply(console, args);
    };

    // Override console.warn
    console.warn = (...args) => {
      if (shouldFilter(args[0])) {
        return; // Suppress the message
      }
      originalConsoleWarn.apply(console, args);
    };

    // Override console.log (in case some libraries use it for warnings)
    console.log = (...args) => {
      if (shouldFilter(args[0])) {
        return; // Suppress the message
      }
      originalConsoleLog.apply(console, args);
    };

    // Cleanup function to restore original console methods
    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.log = originalConsoleLog;
    };
  }, []);

  return null; // This component doesn't render anything
} 