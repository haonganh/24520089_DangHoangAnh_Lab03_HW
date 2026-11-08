
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { NoteRecorder } from './NoteRecorder';

describe('T12 - NoteRecorder Tests', () => {
  let now = 1000;

  beforeEach(() => {
    now = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('records MIDI notes with correct timing', () => {
    const recorder = new NoteRecorder();

    recorder.start();

    now = 1100;
    recorder.noteOn(60, 261.63);

    now = 1250;
    recorder.noteOff(60);

    now = 1300;
    recorder.noteOn(64, 329.63);

    now = 1500;
    recorder.noteOff(64);

    const notes = recorder.stop();

    expect(notes).toHaveLength(2);
    expect(notes[0].midi).toBe(60);
    expect(notes[0].durationMs).toBe(150);
    expect(notes[0].deltaMs).toBe(100);

    expect(notes[1].midi).toBe(64);
    expect(notes[1].durationMs).toBe(200);
    expect(notes[1].deltaMs).toBe(200);
  });

  it('supports overlapping notes', () => {
    const recorder = new NoteRecorder();

    recorder.start();

    now = 1100;
    recorder.noteOn(60, 261.63);
    recorder.noteOn(64, 329.63);

    now = 1200;
    recorder.noteOff(64);

    now = 1300;
    recorder.noteOff(60);

    const notes = recorder.stop();

    expect(notes).toHaveLength(2);
    expect(notes.map((note) => note.midi))
      .toEqual([60, 64]);

    expect(notes[0].deltaMs).toBe(100);
    expect(notes[1].deltaMs).toBe(0);
  });

  it('prevents duplicate note-on events', () => {
    const recorder = new NoteRecorder();

    recorder.start();

    now = 1100;
    recorder.noteOn(60, 261.63);
    recorder.noteOn(60, 261.63);

    now = 1200;
    recorder.noteOff(60);

    expect(recorder.stop()).toHaveLength(1);
  });

  it('releases held notes when recording stops', () => {
    const recorder = new NoteRecorder();

    recorder.start();

    now = 1100;
    recorder.noteOn(60, 261.63);

    now = 1400;
    const notes = recorder.stop();

    expect(notes).toHaveLength(1);
    expect(notes[0].durationMs).toBe(300);
  });

  it('clears recording data', () => {
    const recorder = new NoteRecorder();

    recorder.start();

    now = 1100;
    recorder.noteOn(60, 261.63);

    recorder.clear();

    expect(recorder.stop()).toEqual([]);

    recorder.start();
    expect(recorder.stop()).toEqual([]);
  });
});
