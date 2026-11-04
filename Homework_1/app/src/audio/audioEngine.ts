
import { drumPads, type DrumCode } from '../config/drumPads';

export class AudioEngine {
  private context: AudioContext | null = null;
  private output: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  private buffers = new Map<DrumCode, AudioBuffer>();
  private loading = new Map<DrumCode, Promise<AudioBuffer>>();
  private controller = new AbortController();
  private disposed = false;

  private getContext(): AudioContext {
    if (!this.context) {
      const context = new AudioContext();

      const gain = context.createGain();
      gain.gain.value = 0.25;

      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -12;
      compressor.ratio.value = 12;

      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;

      gain.connect(compressor);
      compressor.connect(analyser);
      analyser.connect(context.destination);

      this.context = context;
      this.output = gain;
      this.analyser = analyser;
    }

    return this.context;
  }

  private async load(
    code: DrumCode,
    context: AudioContext
  ): Promise<AudioBuffer> {
    const cached = this.buffers.get(code);
    if (cached) return cached;

    const pending = this.loading.get(code);
    if (pending) return pending;

    const pad = drumPads.find((item) => item.code === code);
    if (!pad) throw new Error(`Unknown drum: ${code}`);

    const promise = (async () => {
      const response = await fetch(pad.sound, {
        signal: this.controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Cannot load ${pad.name} audio`);
      }

      const data = await response.arrayBuffer();
      const buffer = await context.decodeAudioData(data);

      if (!this.disposed) this.buffers.set(code, buffer);
      return buffer;
    })();

    this.loading.set(code, promise);

    try {
      return await promise;
    } finally {
      this.loading.delete(code);
    }
  }

  async play(code: DrumCode): Promise<void> {
    if (this.disposed) return;

    const context = this.getContext();

    if (context.state !== 'running') {
      await context.resume();
    }

    const buffer = await this.load(code, context);
    if (this.disposed) return;

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.output!);
    source.start();
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  dispose(): void {
    this.disposed = true;
    this.controller.abort();
    this.buffers.clear();
    this.loading.clear();

    if (this.context && this.context.state !== 'closed') {
      void this.context.close().catch(() => {});
    }
  }
}
