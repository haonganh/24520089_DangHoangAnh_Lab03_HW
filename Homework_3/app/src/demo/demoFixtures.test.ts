
import { describe, expect, it } from 'vitest';
import {
  demoDrops,
  demoSquads,
  formatVnd,
  validateDrops,
  validateSquads,
} from './demoFixtures';

describe('T03 - PUBG Arena Domain', () => {
  it('contains two demo airdrops', () => {
    expect(demoDrops).toHaveLength(2);
  });

  it('contains four PUBG VN squads', () => {
    expect(demoSquads).toHaveLength(4);
  });

  it('validates demo drops', () => {
    expect(validateDrops(demoDrops)).toBe(true);
  });

  it('validates squad standings', () => {
    expect(validateSquads(demoSquads)).toBe(true);
  });

  it('rejects negative inventory', () => {
    const invalid = [
      { ...demoDrops[0], remainingStock: -1 },
    ];

    expect(validateDrops(invalid)).toBe(false);
  });

  it('rejects duplicate drop IDs', () => {
    const invalid = [
      demoDrops[0],
      { ...demoDrops[0] },
    ];

    expect(validateDrops(invalid)).toBe(false);
  });

  it('rejects invalid timestamps', () => {
    const invalid = [
      { ...demoDrops[0], dropEpochMs: Number.NaN },
    ];

    expect(validateDrops(invalid)).toBe(false);
  });

  it('rejects duplicate squad IDs', () => {
    const invalid = [
      demoSquads[0],
      { ...demoSquads[0] },
    ];

    expect(validateSquads(invalid)).toBe(false);
  });

  it('formats Vietnamese currency', () => {
    expect(formatVnd(499000)).toContain('499.000');
  });

  it('rejects negative prices', () => {
    expect(() => formatVnd(-100)).toThrow();
  });
});
