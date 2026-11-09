
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

  setValueAtTime = vi.fn((value: number, _time: number) => {
    this.value = value;
    return this;
  });

  exponentialRampToValueAtTime = vi.fn(
    (value: number, _time: number) => {
      this.value = value;
      return this;
    }
  );

  cancelScheduledValues = vi.fn((_time: number) => {
    return this;
  });
}

class FakeOscillator {
  type = 'sine';
  frequency = new FakeAudioParam();
  onended: (() => void) | null = null;

  connect = vi.fn();
  disconnect = vi.fn();

  start = vi.fn((_when?: number) => {});
  stop = vi.fn((_when?: number) => {});
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
  gains: FakeGain[] = [];

  constructor() {
    FakeAudioContext.latest = this;
  }

  createOscillator() {
    const oscillator = new FakeOscillator();
    this.oscillators.push(oscillator);
    return oscillator;
  }

  createGain() {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain;
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
    vi.restoreAllMocks();
  });

  // TEST 1
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

  // TEST 2
  it('steals the oldest voice when the ninth starts', async () => {
    const synth = new PolyphonicSynth();

    for (let midi = 60; midi < 69; midi++) {
      await synth.noteOn(midi, 440);
    }

    const context = FakeAudioContext.latest!;

    expect(synth.getActiveVoiceCount()).toBe(8);
    expect(context.oscillators).toHaveLength(9);

    // FIFO: First oscillator must be scheduled to stop.
    expect(context.oscillators[0].stop)
      .toHaveBeenCalledTimes(1);

    // Second oscillator must remain active.
    expect(context.oscillators[1].stop)
      .not.toHaveBeenCalled();

    synth.dispose();
  });

  // TEST 3
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

  // TEST 4
  it('releases notes and removes ended voices', async () => {
    const synth = new PolyphonicSynth();

    const voiceId = await synth.noteOn(69, 440);

    const context = FakeAudioContext.latest!;
    const oscillator = context.oscillators[0];

    expect(synth.getActiveVoiceCount()).toBe(1);

    synth.noteOff(voiceId);

    expect(oscillator.stop)
      .toHaveBeenCalledTimes(1);

    // Simulate oscillator completion.
    oscillator.onended?.();

    expect(synth.getActiveVoiceCount()).toBe(0);

    synth.dispose();
  });

  // TEST 5
  it('cleans up resources on dispose', async () => {
    const synth = new PolyphonicSynth();

    await synth.noteOn(60, 261.63);
    await synth.noteOn(64, 329.63);

    const context = FakeAudioContext.latest!;

    synth.dispose();

    expect(synth.getActiveVoiceCount()).toBe(0);

    expect(context.close)
      .toHaveBeenCalledTimes(1);

    for (const oscillator of context.oscillators) {
      expect(oscillator.stop).toHaveBeenCalled();
      expect(oscillator.disconnect).toHaveBeenCalled();
    }

    await expect(synth.noteOn(69, 440))
      .rejects.toThrow('Synthesizer has been disposed');
  });

  // F-03 REGRESSION TEST 6
  it('fades the oldest voice before starting its replacement', async () => {
    const synth = new PolyphonicSynth();

    // Fill all eight voice slots.
    for (let midi = 60; midi < 68; midi++) {
      await synth.noteOn(midi, 440);
    }

    const context = FakeAudioContext.latest!;

    const oldest = context.oscillators[0];

    // Gain index 0 is the master gain.
    // Gain index 1 belongs to the oldest voice.
    const oldestGain = context.gains[1];

    expect(synth.getActiveVoiceCount()).toBe(8);

    // Ninth note triggers FIFO voice stealing.
    await synth.noteOn(68, 440);

    const replacement = context.oscillators[8];

    // Verify the fade-out envelope.
    expect(oldestGain.gain.cancelScheduledValues)
      .toHaveBeenCalledWith(0);

    expect(oldestGain.gain.exponentialRampToValueAtTime)
      .toHaveBeenCalledWith(0.0001, 0.01);

    // Oldest voice stops after the 10ms fade
    // plus a 2ms safety margin.
    expect(oldest.stop)
      .toHaveBeenCalledTimes(1);

    const stopAt = oldest.stop.mock.calls[0][0];

    expect(stopAt).toBeDefined();
    expect(stopAt!).toBeCloseTo(0.012, 5);

    // Replacement must start after the old voice stops.
    expect(replacement.start)
      .toHaveBeenCalledTimes(1);

    const startAt = replacement.start.mock.calls[0][0];

    expect(startAt).toBeDefined();
    expect(startAt!).toBeCloseTo(stopAt!, 5);

    // FIFO limit remains eight voices.
    expect(synth.getActiveVoiceCount()).toBe(8);

    // Do not disconnect the fading voice immediately.
    expect(oldest.disconnect)
      .not.toHaveBeenCalled();

    // Simulate the end of the fading oscillator.
    oldest.onended?.();

    expect(oldest.disconnect)
      .toHaveBeenCalledTimes(1);

    expect(oldestGain.disconnect)
      .toHaveBeenCalledTimes(1);

    synth.dispose();
  });

  // F-03 REGRESSION TEST 7
  it('cleans up fading voices when disposed', async () => {
    const synth = new PolyphonicSynth();

    for (let midi = 60; midi < 69; midi++) {
      await synth.noteOn(midi, 440);
    }

    const context = FakeAudioContext.latest!;

    const stolen = context.oscillators[0];
    const stolenGain = context.gains[1];

    // Stolen voice is scheduled for fade-out.
    expect(stolen.stop)
      .toHaveBeenCalledTimes(1);

    // It must remain connected during the fade.
    expect(stolen.disconnect)
      .not.toHaveBeenCalled();

    synth.dispose();

    // Fading nodes must also be cleaned up.
    expect(stolen.disconnect)
      .toHaveBeenCalledTimes(1);

    expect(stolenGain.disconnect)
      .toHaveBeenCalledTimes(1);

    // All synthesizer resources are released.
    expect(synth.getActiveVoiceCount()).toBe(0);

    expect(context.close)
      .toHaveBeenCalledTimes(1);

    for (const oscillator of context.oscillators) {
      expect(oscillator.disconnect)
        .toHaveBeenCalled();
    }
  });
});
