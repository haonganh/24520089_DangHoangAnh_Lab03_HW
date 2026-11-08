
import { afterEach, expect, it, vi } from 'vitest';
import { ReplayScheduler } from './ReplayScheduler';

afterEach(() => {
  vi.useRealTimers();
});

const note = (midi: number, deltaMs = 0, durationMs = 100) => ({
  midi,
  freqHz: 440,
  deltaMs,
  durationMs,
});

it('preserves FIFO order and overlapping notes', async () => {
  vi.useFakeTimers();

  const scheduler = new ReplayScheduler();
  const noteOn = vi.fn(async (midi: number) => midi);
  const noteOff = vi.fn();

  const replay = scheduler.play(
    [note(60), note(64, 0, 200)],
    1,
    { noteOn, noteOff }
  );

  await vi.advanceTimersByTimeAsync(0);

  expect(noteOn.mock.calls.map(([midi]) => midi))
    .toEqual([60, 64]);

  await vi.advanceTimersByTimeAsync(200);
  await replay;

  expect(noteOff.mock.calls.map(([id]) => id))
    .toEqual([60, 64]);

  expect(scheduler.isPlaying).toBe(false);
});

it('cancels pending notes and releases active voices', async () => {
  vi.useFakeTimers();

  const scheduler = new ReplayScheduler();
  const noteOn = vi.fn(async (midi: number) => midi);
  const noteOff = vi.fn();

  const replay = scheduler.play(
    [note(60, 0, 500), note(64, 1000, 100)],
    1,
    { noteOn, noteOff }
  );

  await vi.advanceTimersByTimeAsync(0);
  scheduler.stop();

  await expect(replay).rejects.toMatchObject({
    name: 'AbortError',
  });

  await vi.advanceTimersByTimeAsync(1500);

  expect(noteOn).toHaveBeenCalledTimes(1);
  expect(noteOff).toHaveBeenCalledWith(60);
  expect(noteOff).toHaveBeenCalledTimes(1);
});

it('recovers after playback failure', async () => {
  vi.useFakeTimers();

  const scheduler = new ReplayScheduler();

  const failed = scheduler.play(
    [note(60)],
    1,
    {
      noteOn: async () => {
        throw new Error('Audio unavailable');
      },
      noteOff: vi.fn(),
    }
  );

 
// Register the rejection handler before advancing timers.
const failureAssertion = expect(failed).rejects.toThrow(
  'Audio unavailable'
);

await vi.advanceTimersByTimeAsync(0);

await failureAssertion;

  const noteOff = vi.fn();

  const recovered = scheduler.play(
    [note(64)],
    1,
    {
      noteOn: async () => 64,
      noteOff,
    }
  );

  await vi.advanceTimersByTimeAsync(200);
  await recovered;

  expect(noteOff).toHaveBeenCalledWith(64);
});
