
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  formatRemainingTime,
  getAirdropRemainingMs,
} from './airdrop-clock';

describe('T04 - PUBG Anti-Drift Clock', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('calculates remaining time correctly', () => {
    expect(
      getAirdropRemainingMs(60_000, 0, 0)
    ).toBe(60_000);
  });

  it('prevents accumulated timer drift', () => {
    vi.useFakeTimers();
    vi.setSystemTime(100_000);

    const deadline = Date.now() + 60_000;

    expect(getAirdropRemainingMs(deadline))
      .toBe(60_000);

    // Simulate a delayed callback after 25 seconds.
    vi.setSystemTime(125_000);

    expect(getAirdropRemainingMs(deadline))
      .toBe(35_000);

    // Simulate another delayed callback.
    vi.setSystemTime(145_000);

    expect(getAirdropRemainingMs(deadline))
      .toBe(15_000);
  });

  it('resynchronizes after a large clock jump', () => {
    vi.useFakeTimers();
    vi.setSystemTime(100_000);

    const deadline = 160_000;

    // Simulate returning after a long inactive period.
    vi.setSystemTime(200_000);

    expect(getAirdropRemainingMs(deadline))
      .toBe(0);
  });

  it('handles positive server offset', () => {
    expect(
      getAirdropRemainingMs(10_000, 2_000, 5_000)
    ).toBe(3_000);
  });

  it('handles negative server offset', () => {
    expect(
      getAirdropRemainingMs(10_000, -2_000, 5_000)
    ).toBe(7_000);
  });

  it('returns zero at and after the deadline', () => {
    expect(
      getAirdropRemainingMs(10_000, 0, 10_000)
    ).toBe(0);

    expect(
      getAirdropRemainingMs(10_000, 0, 20_000)
    ).toBe(0);
  });

  it('rejects invalid timestamps and offsets', () => {
    expect(() =>
      getAirdropRemainingMs(Number.NaN)
    ).toThrow(RangeError);

    expect(() =>
      getAirdropRemainingMs(1000, Infinity)
    ).toThrow(RangeError);

    expect(() =>
      getAirdropRemainingMs(1000, 0, Number.NaN)
    ).toThrow(RangeError);
  });

  it('preserves millisecond precision', () => {
    expect(
      getAirdropRemainingMs(10_000, 0, 9_999.5)
    ).toBe(0.5);
  });

  it('formats countdown correctly', () => {
    expect(formatRemainingTime(3_661_000))
      .toBe('01:01:01');

    expect(formatRemainingTime(60_000))
      .toBe('00:01:00');

    expect(formatRemainingTime(0))
      .toBe('00:00:00');
  });

  it('does not display zero before expiry', () => {
    expect(formatRemainingTime(1))
      .toBe('00:00:01');

    expect(() =>
      formatRemainingTime(-1)
    ).toThrow(RangeError);
  });
});
