
interface Voice {
  oscillator: OscillatorNode;
  gain: GainNode;
  releasing: boolean;
}

export class PolyphonicSynth {
  private readonly MAX_VOICES = 8;

  private context: AudioContext | null = null;
  private master: GainNode | null = null;

  // Map preserves insertion order for FIFO voice stealing.
  private voices = new Map<number, Voice>();

  private nextId = 0;
  private disposed = false;

  // T05 - Initialize Web Audio API.
  private getContext(): AudioContext {
    if (this.disposed) {
      throw new Error('Synthesizer has been disposed');
    }

    if (!this.context) {
      if (typeof AudioContext === 'undefined') {
        throw new Error('Web Audio API is not supported');
      }

      const context = new AudioContext();
      const master = context.createGain();

      master.gain.value = 0.25;
      master.connect(context.destination);

      this.context = context;
      this.master = master;
    }

    return this.context;
  }

  // T06 - Remove the oldest voice using FIFO.
  private stealOldestVoice(): void {
    const oldestId = this.voices.keys().next().value;

    if (oldestId === undefined) return;

    const voice = this.voices.get(oldestId);
    if (!voice) return;

    voice.oscillator.onended = null;

    try {
      voice.oscillator.stop();
    } catch {
      // Oscillator may already be stopped.
    }

    voice.oscillator.disconnect();
    voice.gain.disconnect();

    this.voices.delete(oldestId);
  }

  // T05 + T06 - Start a new piano note.
  async noteOn(
    midi: number,
    frequencyHz: number
  ): Promise<number> {
    if (!Number.isInteger(midi) || midi < 21 || midi > 108) {
      throw new Error('Invalid MIDI note');
    }

    if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
      throw new Error('Invalid frequency');
    }

    const ctx = this.getContext();

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    if (this.disposed || ctx.state !== 'running') {
      throw new Error('Audio context unavailable');
    }

    // T06 - Enforce the eight-voice ceiling.
    // The oldest voice is stolen when the limit is reached.
    if (this.voices.size >= this.MAX_VOICES) {
      this.stealOldestVoice();
    }

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    const now = ctx.currentTime;
    const id = ++this.nextId;

    // T05 - Generate the piano tone.
    oscillator.type = 'triangle';

    oscillator.frequency.setValueAtTime(
      frequencyHz,
      now
    );

    // T05 - Smooth attack envelope.
    gain.gain.setValueAtTime(0.0001, now);

    gain.gain.exponentialRampToValueAtTime(
      0.2,
      now + 0.015
    );

    oscillator.connect(gain);
    gain.connect(this.master!);

    const voice: Voice = {
      oscillator,
      gain,
      releasing: false,
    };

    this.voices.set(id, voice);

    // Remove completed voices automatically.
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();

      this.voices.delete(id);
    };

   oscillator.start(now);

console.log('Active voices:', this.getActiveVoiceCount());
console.log('Voice IDs:', [...this.voices.keys()]);

return id;
  }

  // T05 - Release a note with a smooth fade-out.
  noteOff(id: number): void {
    const voice = this.voices.get(id);

    if (
      !voice ||
      voice.releasing ||
      !this.context
    ) {
      return;
    }

    voice.releasing = true;

    const now = this.context.currentTime;
    const envelope = voice.gain.gain;

    envelope.cancelScheduledValues(now);

    envelope.setValueAtTime(
      Math.max(envelope.value, 0.0001),
      now
    );

    envelope.exponentialRampToValueAtTime(
      0.0001,
      now + 0.12
    );

    voice.oscillator.stop(now + 0.14);
  }

  // T06 - Count all voices whose oscillators have not ended.
  getActiveVoiceCount(): number {
    return this.voices.size;
  }

  // T05 + T06 - Clean up all audio resources.
  dispose(): void {
    if (this.disposed) return;

    this.disposed = true;

    for (const voice of this.voices.values()) {
      voice.oscillator.onended = null;

      try {
        voice.oscillator.stop();
      } catch {
        // Oscillator already stopped.
      }

      voice.oscillator.disconnect();
      voice.gain.disconnect();
    }

    this.voices.clear();

    this.master?.disconnect();

    if (
      this.context &&
      this.context.state !== 'closed'
    ) {
      void this.context.close().catch(() => {});
    }

    this.context = null;
    this.master = null;
  }
}
