
// @vitest-environment jsdom

import {
  act,
  cleanup,
  renderHook,
} from '@testing-library/react';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { usePubgAirdropTimer } from './usePubgAirdropTimer';

describe('T05 - PUBG Airdrop Timer Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('displays the initial countdown', () => {
    const { result } = renderHook(() =>
      usePubgAirdropTimer(60_000)
    );

    expect(result.current.remainingMs).toBe(60_000);
    expect(result.current.formattedTime).toBe('00:01:00');
    expect(result.current.isExpired).toBe(false);
  });

  it('updates after time passes', () => {
    const { result } = renderHook(() =>
      usePubgAirdropTimer(60_000)
    );

    act(() => {
      vi.advanceTimersByTime(20_000);
    });

    expect(result.current.remainingMs).toBe(40_000);
    expect(result.current.formattedTime).toBe('00:00:40');
  });

  it('resynchronizes after returning to the tab', () => {
    const { result } = renderHook(() =>
      usePubgAirdropTimer(60_000)
    );

    // Simulate a large time jump without interval callbacks.
    vi.setSystemTime(55_000);

    act(() => {
      document.dispatchEvent(
        new Event('visibilitychange')
      );
    });

    expect(result.current.remainingMs).toBe(5_000);
    expect(result.current.formattedTime).toBe('00:00:05');
  });

  it('supports server clock offsets', () => {
    const { result } = renderHook(() =>
      usePubgAirdropTimer(60_000, 5_000)
    );

    expect(result.current.remainingMs).toBe(55_000);
  });

  it('expires at the deadline', () => {
    const { result } = renderHook(() =>
      usePubgAirdropTimer(10_000)
    );

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(result.current.remainingMs).toBe(0);
    expect(result.current.isExpired).toBe(true);
    expect(result.current.formattedTime).toBe('00:00:00');
  });

  it('cleans up timers after unmount', () => {
    const { unmount } = renderHook(() =>
      usePubgAirdropTimer(60_000)
    );

    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
