'use client';

import { useState, useEffect } from 'react';

interface PlaylistLoaderProps {
  onComplete?: () => void;
  playlistName?: string;
  totalTracks?: number;
}

export default function PlaylistLoader({ onComplete, playlistName, totalTracks }: PlaylistLoaderProps) {
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
        { progress: 25, status: 'Fetching playlist metadata...' },
        { progress: 40, status: 'Calculating total tracks...' },
        { progress: 60, status: 'Fetching track data...' },
        { progress: 80, status: 'Processing playlist information...' },
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
      }, 600); // Faster than liked songs since playlists are usually smaller
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
        }, 300);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center p-8 max-w-md">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-green-500">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Loading Playlist
          </h1>
          {playlistName && (
            <h2 className="text-lg text-green-400 mb-2">{playlistName}</h2>
          )}
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
              ? `Loading ${totalTracks} tracks from Spotify...` 
              : 'Loading playlist tracks from Spotify...'
            : 'Ready to play!'
          }
        </p>
      </div>
    </div>
  );
} 