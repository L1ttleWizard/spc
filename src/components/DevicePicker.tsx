"use client";

import React, { useState } from 'react';
import { ChevronDown, Monitor, Smartphone, Speaker, Tv, Tablet, Computer } from 'lucide-react';
import useDeviceDetection from '@/hooks/useDeviceDetection';
import { useSession } from '@/hooks/useSession';
import { useSpotifyPlayerContext } from './SpotifyPlayerProvider';

interface DevicePickerProps {
  className?: string;
}

const getDeviceIcon = (type: string) => {
  switch (type) {
    case 'Computer':
      return <Computer className="w-4 h-4" />;
    case 'Smartphone':
      return <Smartphone className="w-4 h-4" />;
    case 'Speaker':
      return <Speaker className="w-4 h-4" />;
    case 'TV':
      return <Tv className="w-4 h-4" />;
    case 'Tablet':
      return <Tablet className="w-4 h-4" />;
    default:
      return <Monitor className="w-4 h-4" />;
  }
};

export default function DevicePicker({ className = "" }: DevicePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { accessToken } = useSession();
  const { currentDevice, availableDevices, isLoading, error } = useDeviceDetection(accessToken);
  const { transferPlayback } = useSpotifyPlayerContext();

  const handleDeviceSelect = async (deviceId: string) => {
    if (!accessToken) return;

    try {
      await transferPlayback(deviceId);
      setIsOpen(false);
    } catch (error) {
      console.error('Error transferring playback:', error);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  if (error) {
    return (
      <div className={`text-red-400 text-xs ${className}`}>
        Error loading devices
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={toggleDropdown}
        className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors duration-200"
        disabled={isLoading}
      >
        {currentDevice ? (
          <>
            {getDeviceIcon(currentDevice.type)}
            <span className="text-sm font-medium truncate max-w-24">
              {currentDevice.name}
            </span>
          </>
        ) : (
          <>
            <Monitor className="w-4 h-4" />
            <span className="text-sm font-medium">
              {isLoading ? 'Loading...' : 'No device'}
            </span>
          </>
        )}
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-64 bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-neutral-700">
            <h3 className="text-white font-medium text-sm">Connect to a device</h3>
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {availableDevices.length === 0 ? (
              <div className="p-3 text-neutral-400 text-sm">
                No devices available
              </div>
            ) : (
              availableDevices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => handleDeviceSelect(device.id)}
                  className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-neutral-800 transition-colors duration-200 ${
                    device.isActive ? 'bg-neutral-800 text-green-400' : 'text-white'
                  } ${device.isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={device.isRestricted}
                >
                  {getDeviceIcon(device.type)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {device.name}
                    </div>
                    <div className="text-xs text-neutral-400">
                      {device.type}
                    </div>
                  </div>
                  {device.isActive && (
                    <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
          
          <div className="p-3 border-t border-neutral-700">
            <a
              href="https://open.spotify.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:text-green-300 text-sm font-medium"
            >
              Open Spotify
            </a>
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}