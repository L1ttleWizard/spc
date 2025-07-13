'use client';

import { usePathname } from 'next/navigation';
import { Player } from './Player';

export function ConditionalPlayer() {
  const pathname = usePathname();
  
  // Hide player on login page
  const shouldHidePlayer = pathname === '/login';
  
  if (shouldHidePlayer) {
    return null;
  }
  
  return (
    <div className="h-24 flex-shrink-0">
      <Player />
    </div>
  );
} 