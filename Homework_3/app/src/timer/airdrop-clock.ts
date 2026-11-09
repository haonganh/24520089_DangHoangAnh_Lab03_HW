
/**
 * T04 - PUBG Airdrop Anti-Drift Clock
 * Adapted from Lab 2 HW3.
 */

export function getAirdropRemainingMs(
  targetEpochMs: number,
  serverOffsetMs = 0,
  nowEpochMs = Date.now()
): number {
  if (
    !Number.isFinite(targetEpochMs) ||
    !Number.isFinite(serverOffsetMs) ||
    !Number.isFinite(nowEpochMs)
  ) {
    throw new RangeError('Invalid timer value');
  }

  const serverNow = nowEpochMs + serverOffsetMs;

  return Math.max(0, targetEpochMs - serverNow);
}

/**
 * Convert milliseconds to HH:MM:SS for display.
 * Round up to avoid showing 00:00:00 too early.
 */
export function formatRemainingTime(
  remainingMs: number
): string {
  if (
    !Number.isFinite(remainingMs) ||
    remainingMs < 0
  ) {
    throw new RangeError('Invalid remaining time');
  }

  const totalSeconds = Math.ceil(remainingMs / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}
