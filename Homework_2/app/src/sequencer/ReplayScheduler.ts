
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

// Abortable delay adapted from Lab 2 HW2.
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

// F-01 FIX: Do not wait indefinitely for pending audio tasks.
function waitOrAbort<T>(
  task: Promise<T>,
  signal: AbortSignal
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const cleanup = () => {
      signal.removeEventListener('abort', onAbort);
    };

    const onAbort = () => {
      cleanup();
      reject(abortError());
    };

    task.then(
      (value) => {
        cleanup();
        resolve(value);
      },
      (error: unknown) => {
        cleanup();
        reject(error);
      }
    );

    if (signal.aborted) {
      onAbort();
    } else {
      signal.addEventListener('abort', onAbort, { once: true });
    }
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

    const handleFailure = (error: unknown) => {
      if (!signal.aborted) {
        failure ??= error;
        session.controller.abort();
      }
    };

    try {
      // FIFO: Preserve recorded note order.
      for (const note of notes) {
        if (note.deltaMs > 0) {
          await delay(note.deltaMs / speed, signal);
        }

        if (signal.aborted) throw abortError();

        // Allow overlapping notes without blocking the queue.
        const start = Promise.resolve()
          .then(() => {
            if (signal.aborted) throw abortError();
            return callbacks.noteOn(note.midi, note.freqHz);
          })
          .then((voiceId) => {
            // F-01: Release late results after cancellation.
            if (signal.aborted) {
              callbacks.noteOff(voiceId);
              return;
            }

            session.activeVoices.add(voiceId);

            const release = delay(
              note.durationMs / speed,
              signal
            )
              .then(() => {
                if (session.activeVoices.delete(voiceId)) {
                  callbacks.noteOff(voiceId);
                }
              })
              .catch(handleFailure);

            releases.push(release);
          })
          .catch(handleFailure);

        starts.push(start);
      }

      // F-01: Wait for note starts, but allow immediate abort.
      await waitOrAbort(Promise.all(starts), signal);

      if (failure) throw failure;
      if (signal.aborted) throw abortError();

      // F-01: Release waits are also abortable.
      await waitOrAbort(Promise.all(releases), signal);

      if (failure) throw failure;
      if (signal.aborted) throw abortError();

    } catch (error) {
      // F-01: Never block cleanup on pending noteOn promises.
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
    if (this.disposed) return;

    this.disposed = true;
    this.stop();
  }
}
