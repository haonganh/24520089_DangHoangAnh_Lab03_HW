# Lab 3 – Homework 2

## Lab 2 HW2 Code Reuse and Migration

**Source:** Lab 2 Homework 2 – FIFO AudioTaskQueue

**Target:** Lab 3 Homework 2 – 88-Key Polyphonic Piano & Concurrent FIFO Sequencer

### Reusable Patterns

- FIFO task ordering
- AbortController-based cancellation
- Individual and global task cancellation
- Promise settlement protection
- Resource cleanup using dispose()
- Asynchronous task lifecycle management

### Migration Plan

1. Replace audio download tasks with typed MIDI note replay tasks.
2. Adapt FIFO processing to the piano sequencer.
3. Preserve cancellation and cleanup principles.
4. Implement polyphonic synthesis separately.
5. Use an insertion-ordered Map for eight-voice FIFO stealing.
6. Add regression tests for FIFO ordering, Stop, unmount, and stale asynchronous operations.

### Expected Behavior

- Recorded notes replay in the correct order and timing.
- Playback supports 0.5x, 1x, and 2x speeds.
- Stop cancels pending replay operations.
- Unmount releases associated resources.
- No stale asynchronous operation restarts playback after cancellation.

**Implementation Status:** Planned. Source reuse has been analyzed; implementation and tests are pending.
