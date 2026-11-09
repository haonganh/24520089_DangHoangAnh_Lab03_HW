
interface Voice {
  oscillator: OscillatorNode;
  gain: GainNode;
  releasing: boolean;
}

export class PolyphonicSynth {
  private readonly MAX_VOICES = 8;
  private readonly STEAL_FADE_SECONDS = 0.01;
  private readonly STEAL_STOP_PADDING_SECONDS = 0.002;

  private context: AudioContext | null = null;
  private master: GainNode | null = null;

  // FIFO insertion order.
  private readonly voices = new Map<number, Voice>();

  // Tracks all nodes, including voices fading after stealing.
  private readonly liveVoices = new Set<Voice>();

  private nextId = 0;
  private disposed = false;

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

  // F-03 FIX: Fade the oldest voice before stopping it.
  private stealOldestVoice(now: number): number {
    const oldestId = this.voices.keys().next().value;

    if (oldestId === undefined) return now;

    const voice = this.voices.get(oldestId);
    if (!voice) return now;

    const stopAt =
      now +
      this.STEAL_FADE_SECONDS +
      this.STEAL_STOP_PADDING_SECONDS;

    const volume = voice.gain.gain;

    // Smoothly reduce the outgoing voice.
    volume.cancelScheduledValues(now);
    volume.setValueAtTime(
      Math.max(volume.value, 0.0001),
      now
    );

    volume.exponentialRampToValueAtTime(
      0.0001,
      now + this.STEAL_FADE_SECONDS
    );

    voice.releasing = true;

    // Stop after the fade has completed.
    voice.oscillator.stop(stopAt);

    // Free the FIFO slot, but preserve audio node cleanup.
    this.voices.delete(oldestId);

    return stopAt;
  }

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

    const now = ctx.currentTime;

    // F-03: The replacement starts after the stolen voice stops.
    const startAt =
      this.voices.size >= this.MAX_VOICES
        ? this.stealOldestVoice(now)
        : now;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const id = ++this.nextId;

    oscillator.type = 'triangle';

    oscillator.frequency.setValueAtTime(
      frequencyHz,
      startAt
    );

    // Smooth attack.
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(
      0.2,
      startAt + 0.015
    );

    oscillator.connect(gain);
    gain.connect(this.master!);

    const voice: Voice = {
      oscillator,
      gain,
      releasing: false,
    };

    this.voices.set(id, voice);
    this.liveVoices.add(voice);

    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();

      this.liveVoices.delete(voice);

      if (this.voices.get(id) === voice) {
        this.voices.delete(id);
      }
    };

    oscillator.start(startAt);

    return id;
  }

  noteOff(id: number): void {
    const voice = this.voices.get(id);

    if (!voice || voice.releasing || !this.context) {
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

  getActiveVoiceCount(): number {
    return this.voices.size;
  }

  dispose(): void {
    if (this.disposed) return;

    this.disposed = true;

    // Clean up both active and fading voices.
    for (const voice of this.liveVoices) {
      voice.oscillator.onended = null;

      try {
        voice.oscillator.stop();
      } catch {
        // Oscillator may already be stopped.
      }

      voice.oscillator.disconnect();
      voice.gain.disconnect();
    }

    this.liveVoices.clear();
    this.voices.clear();

    this.master?.disconnect();

    if (this.context && this.context.state !== 'closed') {
      void this.context.close().catch(() => {});
    }

    this.context = null;
    this.master = null;
  }
}
