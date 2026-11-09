
import type {
  DropPhase,
  PubgCrateDrop,
} from '../domain/pubg-vn-arena-contract';

export const AIRDROP_LIVE_DURATION_MS = 10 * 60_000;

type DropState = Pick<
  PubgCrateDrop,
  'dropEpochMs' | 'remainingStock'
>;

export function getDropPhase(
  drop: DropState,
  nowEpochMs: number,
  serverOffsetMs = 0,
  liveDurationMs = AIRDROP_LIVE_DURATION_MS
): DropPhase {
  if (
    !Number.isFinite(drop.dropEpochMs) ||
    !Number.isInteger(drop.remainingStock) ||
    drop.remainingStock < 0 ||
    !Number.isFinite(nowEpochMs) ||
    !Number.isFinite(serverOffsetMs) ||
    !Number.isFinite(liveDurationMs) ||
    liveDurationMs <= 0
  ) {
    throw new RangeError('Invalid airdrop state');
  }

  const serverNow = nowEpochMs + serverOffsetMs;
  const closingEpochMs =
    drop.dropEpochMs + liveDurationMs;

  // Before opening
  if (serverNow < drop.dropEpochMs) {
    return 'WARMUP';
  }

  // After the closing deadline
  if (serverNow >= closingEpochMs) {
    return 'EXPIRED';
  }

  // Sold out during the live window
  if (drop.remainingStock === 0) {
    return 'LOOTED_OUT';
  }

  return 'AIRDROP_LIVE';
}

export function canClaimDrop(phase: DropPhase): boolean {
  return phase === 'AIRDROP_LIVE';
}

