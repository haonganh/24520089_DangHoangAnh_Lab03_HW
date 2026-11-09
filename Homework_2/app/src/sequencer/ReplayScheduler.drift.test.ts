
import { afterEach, expect, it, vi } from 'vitest';
import { ReplayScheduler } from './ReplayScheduler';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it('compensates for timer drift during replay', async () => {
  vi.useFakeTimers();

  // Simulate a delayed scheduling decision.
  const readings = [0, 0, 170];

  vi.spyOn(performance, 'now').mockImplementation(
    () => readings.shift() ?? 170
  );

  const scheduler = new ReplayScheduler();

  const noteOn = vi.fn(
    async (midi: number) => midi
  );

  const noteOff = vi.fn();

  const replay = scheduler.play(
    [
      {
        midi: 60,
        freqHz: 261.63,
        deltaMs: 100,
        durationMs: 500,
      },
      {
        midi: 64,
        freqHz: 329.63,
        deltaMs: 100,
        durationMs: 500,
      },
    ],
    1,
    { noteOn, noteOff }
  );

  await vi.advanceTimersByTimeAsync(100);

  expect(
    noteOn.mock.calls.map(([midi]) => midi)
  ).toEqual([60]);

  // F-02: Wait only 30ms instead of another 100ms.
  await vi.advanceTimersByTimeAsync(29);

  expect(noteOn).toHaveBeenCalledTimes(1);

  await vi.advanceTimersByTimeAsync(1);

  expect(
    noteOn.mock.calls.map(([midi]) => midi)
  ).toEqual([60, 64]);

  await vi.advanceTimersByTimeAsync(500);
  await replay;

  expect(
    noteOff.mock.calls.map(([voiceId]) => voiceId)
  ).toEqual([60, 64]);

  expect(scheduler.isPlaying).toBe(false);
});
