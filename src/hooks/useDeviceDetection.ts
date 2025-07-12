import { useState, useEffect } from 'react';

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

  const fetchDevices = async () => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch devices: ${response.status}`);
      }

      const data = await response.json();
      const devices: DeviceInfo[] = data.devices.map((device: any) => ({
        id: device.id,
        name: device.name,
        type: device.type as DeviceInfo['type'],
        isActive: device.is_active,
        isRestricted: device.is_restricted,
      }));

      setAvailableDevices(devices);
      
      // Find the currently active device
      const activeDevice = devices.find(device => device.isActive);
      setCurrentDevice(activeDevice || null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch devices');
      console.error('Error fetching devices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    
    // Refresh devices every 30 seconds
    const interval = setInterval(fetchDevices, 30000);
    
    return () => clearInterval(interval);
  }, [accessToken]);

  return {
    currentDevice,
    availableDevices,
    isLoading,
    error,
  };
};

export default useDeviceDetection; 