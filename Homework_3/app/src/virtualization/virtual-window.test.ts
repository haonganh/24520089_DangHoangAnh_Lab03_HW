
import { describe, expect, it } from 'vitest';

import {
  getVirtualWindow,
} from './virtual-window';

describe('T12 - Virtual Scroller', () => {
  it('renders only visible rows plus overscan', () => {
    const result = getVirtualWindow(
      1000,
      0,
      420,
      136,
      3
    );

    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(8);
    expect(result.totalHeight).toBe(136_000);
  });

  it('updates the window after scrolling', () => {
    const result = getVirtualWindow(
      1000,
      13_600,
      420,
      136,
      3
    );

    expect(result.startIndex).toBe(97);
    expect(result.endIndex).toBe(108);
  });

  it('stops at the final item', () => {
    const result = getVirtualWindow(
      1000,
      999_999,
      420,
      136,
      3
    );

    expect(result.endIndex).toBe(1000);
    expect(result.startIndex).toBeLessThan(1000);
  });

  it('handles an empty list', () => {
    expect(
      getVirtualWindow(0, 0, 420, 136)
    ).toEqual({
      startIndex: 0,
      endIndex: 0,
      totalHeight: 0,
    });
  });

  it('handles a small list', () => {
    const result = getVirtualWindow(
      4,
      0,
      420,
      136
    );

    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(4);
  });

  it('rejects invalid configuration', () => {
    expect(() =>
      getVirtualWindow(-1, 0, 420, 136)
    ).toThrow(RangeError);

    expect(() =>
      getVirtualWindow(100, 0, 420, 0)
    ).toThrow(RangeError);

    expect(() =>
      getVirtualWindow(100, 0, -1, 136)
    ).toThrow(RangeError);
  });
});
