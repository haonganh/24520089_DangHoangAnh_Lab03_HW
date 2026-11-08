
import type { RecordedNote } from './NoteRecorder';

export type ReplaySpeed = 0.5 | 1 | 2;

interface ReplayCallbacks {
  noteOn: (midi: number, freqHz: number) => Promise<number>;
  noteOff: (voiceId: number) => void;
}

interface ReplaySession {
  controller: AbortController;
  activeVoices: Set<number>;
  callbacks: ReplayCallbacks;
}

function abortError(): DOMException {
  return new DOMException('Replay cancelled', 'AbortError');
}

// Adapted from Lab 2 HW2: abortable asynchronous tasks.
function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError());
      return;
    }

    let timer: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
    };

    const onAbort = () => {
      cleanup();
      reject(abortError());
    };

    timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export class ReplayScheduler {
  private session: ReplaySession | null = null;
  private disposed = false;

  get isPlaying(): boolean {
    return this.session !== null;
  }

  async play(
    notes: readonly RecordedNote[],
    speed: ReplaySpeed,
    callbacks: ReplayCallbacks
  ): Promise<void> {
    if (this.disposed) throw new Error('Scheduler disposed');
    if (this.session) throw new Error('Replay already running');
    if (![0.5, 1, 2].includes(speed)) {
      throw new Error('Invalid replay speed');
    }

    for (const note of notes) {
      if (
        !Number.isInteger(note.midi) ||
        note.midi < 21 ||
        note.midi > 108 ||
        !Number.isFinite(note.freqHz) ||
        note.freqHz <= 0 ||
        !Number.isFinite(note.deltaMs) ||
        note.deltaMs < 0 ||
        !Number.isFinite(note.durationMs) ||
        note.durationMs <= 0
      ) {
        throw new Error('Invalid recorded note');
      }
    }

    const session: ReplaySession = {
      controller: new AbortController(),
      activeVoices: new Set(),
      callbacks,
    };

    this.session = session;
    const signal = session.controller.signal;

    const starts: Promise<void>[] = [];
    const releases: Promise<void>[] = [];
    let failure: unknown = null;

    try {
      // One FIFO worker schedules note onsets in recorded order.
      for (const note of notes) {
       
if (note.deltaMs > 0) {
  await delay(note.deltaMs / speed, signal);
}


        if (signal.aborted) throw abortError();

        // Do not await noteOn here: chords must overlap.
        const start = Promise.resolve()
          .then(() => callbacks.noteOn(note.midi, note.freqHz))
          .then((voiceId) => {
            if (signal.aborted) {
              callbacks.noteOff(voiceId);
              return;
            }

            session.activeVoices.add(voiceId);

            const release = delay(
              note.durationMs / speed,
              signal
            ).then(() => {
              if (session.activeVoices.delete(voiceId)) {
                callbacks.noteOff(voiceId);
              }
            }).catch((error: unknown) => {
              if (!signal.aborted) throw error;
            });

            releases.push(release);
          })
          .catch((error: unknown) => {
            if (!signal.aborted) {
              failure = error;
              session.controller.abort();
            }
          });

        starts.push(start);
      }

      await Promise.all(starts);

      if (failure) throw failure;
      if (signal.aborted) throw abortError();

      await Promise.all(releases);

      if (signal.aborted) throw abortError();
    } catch (error) {
      await Promise.all(starts);
      await Promise.all(releases);

      if (failure) throw failure;
      throw error;
    } finally {
      session.controller.abort();

      for (const voiceId of session.activeVoices) {
        callbacks.noteOff(voiceId);
      }

      session.activeVoices.clear();

      if (this.session === session) {
        this.session = null;
      }
    }
  }

  stop(): void {
    const session = this.session;
    if (!session) return;

    session.controller.abort();

    for (const voiceId of session.activeVoices) {
      session.callbacks.noteOff(voiceId);
    }

    session.activeVoices.clear();
  }

  dispose(): void {
    this.disposed = true;
    this.stop();
  }
}
