
export interface RecordedNote {
  midi: number;
  freqHz: number;
  durationMs: number;
  deltaMs: number;
}

interface PendingNote {
  midi: number;
  freqHz: number;
  startMs: number;
  order: number;
}

interface CompletedNote extends PendingNote {
  durationMs: number;
}

export class NoteRecorder {
  private startedAt: number | null = null;
  private active = new Map<number, PendingNote>();
  private completed: CompletedNote[] = [];
  private sequence = 0;

  start(): void {
    this.clear();
    this.startedAt = performance.now();
  }

  noteOn(midi: number, freqHz: number): void {
    if (this.startedAt === null || this.active.has(midi)) return;

    this.active.set(midi, {
      midi,
      freqHz,
      startMs: Math.round(performance.now() - this.startedAt),
      order: this.sequence++,
    });
  }

  noteOff(midi: number, now = performance.now()): void {
    const note = this.active.get(midi);
    if (!note || this.startedAt === null) return;

    this.active.delete(midi);

    this.completed.push({
      ...note,
      durationMs: Math.max(
        1,
        Math.round(now - this.startedAt - note.startMs)
      ),
    });
  }

  stop(): RecordedNote[] {
    if (this.startedAt === null) return [];

    const now = performance.now();

    // Flush notes still held when recording stops.
    for (const midi of this.active.keys()) {
      this.noteOff(midi, now);
    }

    this.startedAt = null;

    const ordered = [...this.completed].sort(
      (a, b) => a.startMs - b.startMs || a.order - b.order
    );

    let previousStart = 0;

    return ordered.map((note) => {
      const deltaMs = Math.max(0, note.startMs - previousStart);
      previousStart = note.startMs;

      return {
        midi: note.midi,
        freqHz: note.freqHz,
        durationMs: note.durationMs,
        deltaMs,
      };
    });
  }

  clear(): void {
    this.startedAt = null;
    this.active.clear();
    this.completed = [];
    this.sequence = 0;
  }
}
