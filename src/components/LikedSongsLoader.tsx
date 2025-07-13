'use client';

import { useState, useEffect } from 'react';

interface LikedSongsLoaderProps {
  onComplete?: () => void;
  totalTracks?: number;
}

export default function LikedSongsLoader({ onComplete, totalTracks }: LikedSongsLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    
    const simulateProgress = () => {
      setProgress(0);
      setStatus('Connecting to Spotify...');
      
      // Simulate realistic progress based on typical API call patterns
      const progressSteps = [
        { progress: 10, status: 'Authenticating...' },
        { progress: 25, status: 'Fetching initial batch...' },
        { progress: 40, status: 'Calculating total tracks...' },
        { progress: 60, status: 'Fetching additional pages...' },
        { progress: 80, status: 'Processing track data...' },
        { progress: 90, status: 'Finalizing...' }
      ];
      
      let currentStep = 0;
      
      progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length) {
          const step = progressSteps[currentStep];
          setProgress(step.progress);
          setStatus(step.status);
          currentStep++;
        } else {
          clearInterval(progressInterval);
        }
      }, 800); // Slower, more realistic timing
    };

    simulateProgress();

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, []);

  useEffect(() => {
    if (progress >= 90) {
      setStatus('Almost done...');
      const timer = setTimeout(() => {
        setProgress(100);
        setStatus('Complete!');
        setTimeout(() => {
          onComplete?.();
        }, 500);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center p-8 max-w-md">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-green-500">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Loading Liked Songs</h1>
          <p className="text-gray-300 text-sm mb-6">{status}</p>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <p className="text-gray-400 text-xs">
          {progress < 100 
            ? totalTracks 
              ? `Fetching ${totalTracks} liked songs from Spotify...` 
              : 'Fetching all your liked songs from Spotify...'
            : 'Ready to play!'
          }
        </p>
      </div>
    </div>
  );
} 