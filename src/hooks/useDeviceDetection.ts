import { useState, useEffect, useCallback } from 'react';

export interface DeviceInfo {
  id: string;
  name: string;
  type: 'Computer' | 'Smartphone' | 'Speaker' | 'TV' | 'Tablet' | 'Unknown';
  isActive: boolean;
  isRestricted: boolean;
}

export interface DeviceDetectionResult {
  currentDevice: DeviceInfo | null;
  availableDevices: DeviceInfo[];
  isLoading: boolean;
  error: string | null;
}

const useDeviceDetection = (accessToken: string | null): DeviceDetectionResult => {
  const [currentDevice, setCurrentDevice] = useState<DeviceInfo | null>(null);
  const [availableDevices, setAvailableDevices] = useState<DeviceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    if (!accessToken) {
      console.log('🔑 No access token available for device detection');
      return;
    }

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('🔑 Device detection: Authentication required');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAvailableDevices(data.devices || []);
      setCurrentDevice(data.devices?.find((device: any) => device.is_active) || null);
    } catch (error) {
      // Only log errors that aren't authentication related
      if (error instanceof Error && !error.message.includes('401')) {
        console.error('❌ Error fetching devices:', error);
      }
    }
  }, [accessToken]);

  useEffect(() => {
    fetchDevices();
    
    // Refresh devices every 30 seconds
    const interval = setInterval(fetchDevices, 30000);
    
    return () => clearInterval(interval);
  }, [accessToken, fetchDevices]);

  return {
    currentDevice,
    availableDevices,
    isLoading,
    error,
  };
};

export default useDeviceDetection; 