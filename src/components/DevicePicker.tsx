import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDevices, transferPlayback } from '@/redux/thunks/playerThunks';
import { selectDevices, selectSelectedDeviceId, selectPlayerState } from '@/redux/slices/playerSlice';
import { AppDispatch } from '@/redux/store';
import { useSession } from '@/hooks/useSession';
import { Check, Monitor, Smartphone, Speaker } from 'lucide-react';

interface DevicePickerProps {
  onClose: () => void;
}

const DevicePicker: React.FC<DevicePickerProps> = ({ onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { accessToken } = useSession();
  const devices = useSelector(selectDevices) || [];
  const selectedDeviceId = useSelector(selectSelectedDeviceId);
  const { status, error } = useSelector(selectPlayerState);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!accessToken) return;
    dispatch(fetchDevices({ accessToken }));
    const interval = setInterval(() => {
      dispatch(fetchDevices({ accessToken }));
    }, 5000);
    // Focus close button on open
    closeBtnRef.current?.focus();
    // Escape to close
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [accessToken, dispatch, onClose]);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'Computer': return <Monitor className="inline mr-1" size={16} />;
      case 'Smartphone': return <Smartphone className="inline mr-1" size={16} />;
      case 'Speaker': return <Speaker className="inline mr-1" size={16} />;
      default: return null;
    }
  };

  const handleSelect = (deviceId: string, isActive: boolean) => {
    if (accessToken && !isActive) {
      dispatch(transferPlayback({ accessToken, deviceId }));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Выбор устройства">
      <div className="bg-neutral-900 rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Выберите устройство</h2>
        {status === 'loading' && <div className="flex items-center gap-2 text-neutral-400"><span className="animate-spin h-4 w-4 border-2 border-t-transparent border-neutral-400 rounded-full"></span>Загрузка устройств...</div>}
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <ul className="divide-y divide-neutral-800 mb-4">
          {devices.length === 0 && status !== 'loading' && (
            <li className="text-neutral-400 py-2">Нет доступных устройств. Откройте Spotify на другом устройстве.</li>
          )}
          {devices.map(device => (
            <li
              key={device.id}
              className={`flex items-center justify-between py-2 px-2 rounded cursor-pointer transition-colors ${device.id === selectedDeviceId ? 'bg-green-700/30 text-green-400' : 'hover:bg-neutral-800 text-white'} ${device.is_active ? 'font-bold' : ''}`}
              tabIndex={0}
              aria-selected={device.id === selectedDeviceId}
              aria-label={device.name + (device.is_active ? ' (Активно)' : '')}
              onClick={() => device.id && handleSelect(device.id, device.is_active)}
              onKeyDown={e => {
                if ((e.key === 'Enter' || e.key === ' ') && device.id && !device.is_active) {
                  handleSelect(device.id, device.is_active);
                }
              }}
              role="option"
              aria-disabled={device.is_active}
            >
              <span className="truncate flex items-center">
                {getDeviceIcon(device.type)}
                {device.name} {device.is_active && <span className="ml-2 text-xs text-green-400">(Активно)</span>}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">{device.type}</span>
                {device.id === selectedDeviceId && <Check className="text-green-400" size={18} aria-label="Выбрано" />}
              </span>
            </li>
          ))}
        </ul>
        <button ref={closeBtnRef} onClick={onClose} className="mt-2 px-4 py-2 rounded bg-neutral-700 text-white hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-green-500">Закрыть</button>
      </div>
    </div>
  );
};

export default DevicePicker;