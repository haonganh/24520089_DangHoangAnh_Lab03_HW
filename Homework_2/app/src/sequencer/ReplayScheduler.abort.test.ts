
import { expect, it, vi } from 'vitest';
import { ReplayScheduler } from './ReplayScheduler';

it('stops replay while noteOn is pending', async () => {
  const scheduler = new ReplayScheduler();

  let resolveNote!: (id: number) => void;

  const noteOn = vi.fn(() => new Promise<number>((resolve) => {
    resolveNote = resolve;
  }));

  const noteOff = vi.fn();

  const replay = scheduler.play(
    [{
      midi: 69,
      freqHz: 440,
      deltaMs: 0,
      durationMs: 500,
    }],
    1,
    { noteOn, noteOff }
  );

  await vi.waitFor(() => {
    expect(noteOn).toHaveBeenCalledTimes(1);
  });

  const assertion = expect(replay).rejects.toMatchObject({
    name: 'AbortError',
  });

  scheduler.stop();

  await assertion;

  expect(scheduler.isPlaying).toBe(false);

  // Verify that a late audio result is released.
  resolveNote(123);

  await vi.waitFor(() => {
    expect(noteOff).toHaveBeenCalledWith(123);
  });

  scheduler.dispose();
});
