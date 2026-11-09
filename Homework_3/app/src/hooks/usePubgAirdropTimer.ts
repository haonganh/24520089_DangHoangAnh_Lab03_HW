
import { useEffect, useState } from 'react';

import {
  formatRemainingTime,
  getAirdropRemainingMs,
} from '../timer/airdrop-clock';

export interface PubgAirdropTimerResult {
  remainingMs: number;
  formattedTime: string;
  isExpired: boolean;
}

export function usePubgAirdropTimer(
  targetEpochMs: number,
  serverOffsetMs = 0
): PubgAirdropTimerResult {
  const [nowEpochMs, setNowEpochMs] = useState(
    () => Date.now()
  );

  useEffect(() => {
    const syncClock = () => {
      setNowEpochMs(Date.now());
    };

    // Refresh the countdown using absolute time.
    const intervalId = window.setInterval(
      syncClock,
      250
    );

    // Resync immediately when returning to the tab.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncClock();
      }
    };

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    window.addEventListener('focus', syncClock);

    // Prevent timer and event-listener leaks.
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
  };
}
