import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDevices, transferPlayback } from '@/redux/thunks/playerThunks';
import { selectDevices, selectSelectedDeviceId, selectPlayerState } from '@/redux/slices/playerSlice';
import { AppDispatch } from '@/redux/store';
import { useSession } from '@/hooks/useSession';

interface DevicePickerProps {
  onClose: () => void;
}

const DevicePicker: React.FC<DevicePickerProps> = ({ onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { accessToken } = useSession();
  const devices = useSelector(selectDevices) || [];
  const selectedDeviceId = useSelector(selectSelectedDeviceId);
  const { status, error } = useSelector(selectPlayerState);

  useEffect(() => {
    if (accessToken) {
      dispatch(fetchDevices({ accessToken }));
    }
  }, [accessToken, dispatch]);

  const handleSelect = (deviceId: string) => {
    if (accessToken) {
      dispatch(transferPlayback({ accessToken, deviceId }));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Выберите устройство</h2>
        {status === 'loading' && <div className="text-neutral-400">Загрузка устройств...</div>}
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <ul className="divide-y divide-neutral-800 mb-4">
          {devices.length === 0 && status !== 'loading' && (
            <li className="text-neutral-400 py-2">Нет доступных устройств</li>
          )}
          {devices.map(device => (
            <li
              key={device.id}
              className={`flex items-center justify-between py-2 px-2 rounded cursor-pointer transition-colors ${device.id === selectedDeviceId ? 'bg-green-700/30 text-green-400' : 'hover:bg-neutral-800 text-white'}`}
              onClick={() => device.id && handleSelect(device.id)}
            >
              <span className="truncate">{device.name} {device.is_active && <span className="ml-2 text-xs text-green-400">(Активно)</span>}</span>
              <span className="text-xs text-neutral-400">{device.type}</span>
            </li>
          ))}
        </ul>
        <button onClick={onClose} className="mt-2 px-4 py-2 rounded bg-neutral-700 text-white hover:bg-neutral-600">Закрыть</button>
      </div>
    </div>
  );
};

export default DevicePicker;