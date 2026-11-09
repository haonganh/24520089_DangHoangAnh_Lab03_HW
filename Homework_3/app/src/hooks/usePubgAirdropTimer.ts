
import { useEffect, useState } from 'react';

import {
  formatRemainingTime,
  getAirdropRemainingMs,
} from '../timer/airdrop-clock';

export interface PubgAirdropTimerResult {
  remainingMs: number;
  formattedTime: string;
  isExpired: boolean;
  nowEpochMs: number;
}

export function usePubgAirdropTimer(
  targetEpochMs: number,
  serverOffsetMs = 0
): PubgAirdropTimerResult {
  const [nowEpochMs, setNowEpochMs] = useState<number>(
    () => Date.now()
  );

  useEffect(() => {
    const syncClock = () => {
      setNowEpochMs(Date.now());
    };

    // Synchronize immediately when mounted.
    syncClock();

    // Anti-drift: always calculate time from Date.now().
    const intervalId = window.setInterval(syncClock, 250);

    // Resynchronize when returning to the browser tab.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncClock();
      }
    };

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    // Resynchronize when browser window receives focus.
    window.addEventListener('focus', syncClock);

    // Clean up timers and listeners on unmount.
    return () => {
      window.clearInterval(intervalId);

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );

      window.removeEventListener('focus', syncClock);
    };
  }, []);

  const remainingMs = getAirdropRemainingMs(
    targetEpochMs,
    serverOffsetMs,
    nowEpochMs
  );

  return {
    remainingMs,
    formattedTime: formatRemainingTime(remainingMs),
    isExpired: remainingMs === 0,
    nowEpochMs,
  };
}
