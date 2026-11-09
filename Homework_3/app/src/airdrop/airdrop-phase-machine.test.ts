
import { describe, expect, it } from 'vitest';

import {
  AIRDROP_LIVE_DURATION_MS,
  canClaimDrop,
  getDropPhase,
} from './airdrop-phase-machine';

const drop = {
  dropEpochMs: 100_000,
  remainingStock: 10,
};

describe('T06 - Airdrop Phase State Machine', () => {
  it('starts in WARMUP', () => {
    expect(getDropPhase(drop, 50_000))
      .toBe('WARMUP');
  });

  it('becomes AIRDROP_LIVE at opening time', () => {
    expect(getDropPhase(drop, 100_000))
      .toBe('AIRDROP_LIVE');
  });

  it('stays live while stock remains', () => {
    expect(getDropPhase(drop, 150_000))
      .toBe('AIRDROP_LIVE');
  });

  it('becomes LOOTED_OUT when stock reaches zero', () => {
    expect(
      getDropPhase(
        { ...drop, remainingStock: 0 },
        150_000
      )
    ).toBe('LOOTED_OUT');
  });

  it('becomes EXPIRED at closing time', () => {
    expect(
      getDropPhase(
        drop,
        100_000 + AIRDROP_LIVE_DURATION_MS
      )
    ).toBe('EXPIRED');
  });

  it('applies the server clock offset', () => {
    expect(getDropPhase(drop, 95_000, 5_000))
      .toBe('AIRDROP_LIVE');
  });

  it('rejects negative stock', () => {
    expect(() =>
      getDropPhase(
        { ...drop, remainingStock: -1 },
        150_000
      )
    ).toThrow(RangeError);
  });

  it('allows claiming only during AIRDROP_LIVE', () => {
    expect(canClaimDrop('WARMUP')).toBe(false);
    expect(canClaimDrop('AIRDROP_LIVE')).toBe(true);
    expect(canClaimDrop('LOOTED_OUT')).toBe(false);
    expect(canClaimDrop('EXPIRED')).toBe(false);
  });
});
