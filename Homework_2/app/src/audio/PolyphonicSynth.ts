
interface Voice {
  oscillator: OscillatorNode;
  gain: GainNode;
  releasing: boolean;
}

export class PolyphonicSynth {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private voices = new Map<number, Voice>();
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

      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.25;
      this.master.connect(this.context.destination);
    }

    return this.context;
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

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const id = ++this.nextId;

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequencyHz, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(
      0.2,
      now + 0.015
    );

    oscillator.connect(gain);
    gain.connect(this.master!);

    this.voices.set(id, {
      oscillator,
      gain,
      releasing: false,
    });

    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      this.voices.delete(id);
    };

    oscillator.start(now);
    return id;
  }

  noteOff(id: number): void {
    const voice = this.voices.get(id);
    if (!voice || voice.releasing || !this.context) return;

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
    return [...this.voices.values()]
      .filter((voice) => !voice.releasing).length;
  }

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

    if (this.context && this.context.state !== 'closed') {
      void this.context.close().catch(() => {});
    }
  }
}
