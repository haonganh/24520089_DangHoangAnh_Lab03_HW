
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { PolyphonicSynth } from './PolyphonicSynth';

// Mock Web Audio API for deterministic testing.
class FakeAudioParam {
  value = 1;

  setValueAtTime(value: number) {
    this.value = value;
    return this;
  }

  exponentialRampToValueAtTime(value: number) {
    this.value = value;
    return this;
  }

  cancelScheduledValues() {
    return this;
  }
}

class FakeOscillator {
  type = 'sine';
  frequency = new FakeAudioParam();
  onended: (() => void) | null = null;

  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class FakeGain {
  gain = new FakeAudioParam();

  connect = vi.fn();
  disconnect = vi.fn();
}

class FakeAudioContext {
  static latest: FakeAudioContext | null = null;

  state: AudioContextState = 'running';
  currentTime = 0;
  destination = {};

  oscillators: FakeOscillator[] = [];

  constructor() {
    FakeAudioContext.latest = this;
  }

  createOscillator() {
    const oscillator = new FakeOscillator();
    this.oscillators.push(oscillator);
    return oscillator;
  }

  createGain() {
    return new FakeGain();
  }

  resume = vi.fn(async () => {
    this.state = 'running';
  });

  close = vi.fn(async () => {
    this.state = 'closed';
  });
}

describe('T12 - Eight-Voice FIFO Polyphony', () => {
  beforeEach(() => {
    FakeAudioContext.latest = null;
    vi.stubGlobal('AudioContext', FakeAudioContext);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('supports eight simultaneous voices', async () => {
    const synth = new PolyphonicSynth();

    for (let midi = 60; midi < 68; midi++) {
      await synth.noteOn(midi, 440);
    }

    expect(synth.getActiveVoiceCount()).toBe(8);

    const context = FakeAudioContext.latest!;
    expect(context.oscillators).toHaveLength(8);

    synth.dispose();
  });

  it('steals the oldest voice when the ninth starts', async () => {
    const synth = new PolyphonicSynth();

    for (let midi = 60; midi < 69; midi++) {
      await synth.noteOn(midi, 440);
    }

    const context = FakeAudioContext.latest!;

    expect(synth.getActiveVoiceCount()).toBe(8);
    expect(context.oscillators).toHaveLength(9);

    // FIFO: the first oscillator must be stopped.
    expect(context.oscillators[0].stop)
      .toHaveBeenCalledTimes(1);

    // The second oscillator must still be active.
    expect(context.oscillators[1].stop)
      .not.toHaveBeenCalled();

    synth.dispose();
  });

  it('steals voices in FIFO order', async () => {
    const synth = new PolyphonicSynth();

    for (let midi = 60; midi < 70; midi++) {
      await synth.noteOn(midi, 440);
    }

    const context = FakeAudioContext.latest!;

    expect(synth.getActiveVoiceCount()).toBe(8);

    expect(context.oscillators[0].stop)
      .toHaveBeenCalledTimes(1);

    expect(context.oscillators[1].stop)
      .toHaveBeenCalledTimes(1);

    expect(context.oscillators[2].stop)
      .not.toHaveBeenCalled();

    synth.dispose();
  });

  it('releases notes and removes ended voices', async () => {
    const synth = new PolyphonicSynth();

    const voiceId = await synth.noteOn(69, 440);
    const context = FakeAudioContext.latest!;
    const oscillator = context.oscillators[0];

    expect(synth.getActiveVoiceCount()).toBe(1);

    synth.noteOff(voiceId);

    expect(oscillator.stop).toHaveBeenCalledTimes(1);

    // Simulate the oscillator's ended event.
    oscillator.onended?.();

    expect(synth.getActiveVoiceCount()).toBe(0);

    synth.dispose();
  });

  it('cleans up resources on dispose', async () => {
    const synth = new PolyphonicSynth();

    await synth.noteOn(60, 261.63);
    await synth.noteOn(64, 329.63);

    const context = FakeAudioContext.latest!;

    synth.dispose();

    expect(synth.getActiveVoiceCount()).toBe(0);

    expect(context.close).toHaveBeenCalledTimes(1);

    for (const oscillator of context.oscillators) {
      expect(oscillator.stop).toHaveBeenCalled();
      expect(oscillator.disconnect).toHaveBeenCalled();
    }

    await expect(synth.noteOn(69, 440))
      .rejects.toThrow('Synthesizer has been disposed');
  });
});
