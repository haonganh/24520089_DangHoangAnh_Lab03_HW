
import { describe, expect, it } from 'vitest';
import { pianoKeys } from './pianoKeys';

describe('T12 - 88-Key Piano Model', () => {
  it('generates exactly 88 keys', () => {
    expect(pianoKeys).toHaveLength(88);
  });

  it('contains 52 white and 36 black keys', () => {
    expect(pianoKeys.filter(k => !k.isBlack)).toHaveLength(52);
    expect(pianoKeys.filter(k => k.isBlack)).toHaveLength(36);
  });

  it('covers MIDI 21 through 108', () => {
    expect(pianoKeys[0].midi).toBe(21);
    expect(pianoKeys[87].midi).toBe(108);
  });

  it('calculates A4 as 440 Hz', () => {
    const a4 = pianoKeys.find(k => k.midi === 69);

    expect(a4?.frequency).toBeCloseTo(440);
  });

  it('generates unique MIDI values', () => {
    const values = pianoKeys.map(k => k.midi);

    expect(new Set(values).size).toBe(88);
  });
});
