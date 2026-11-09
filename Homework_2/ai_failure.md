# Lab 3 – Homework 2: AI Failure Mode Audit

**Project:** 88-Key Polyphonic Piano & Concurrent FIFO Sequencer  
**Audit date:** 2026-11-09  
**Source inspected:** `24520089_DangHoangAnh_Lab03_Hw.zip` → `Homework_2/app/src/`  
**Target:** At least three actionable failures, with reproducible evidence, manual remediation, and regression verification.  
**Status:** Audit completed; fixes and browser evidence are **pending** unless explicitly verified below.

> **Integrity statement:** This report identifies defects and risks in the AI-assisted implementation. Source inspection alone cannot establish whether an individual line was written by AI or by a person. No browser screenshots, manual fixes, or successful post-fix test runs are claimed unless they have actually been performed.

## 1. Executive summary

| ID | Finding | Severity | Evidence status | Fix status |
| --- | --- | --- | --- | --- |
| F-01 | Stop Replay can hang while an asynchronous `noteOn()` never settles | High | **Reproduced in a Node.js runtime probe** | Not fixed |
| F-02 | Relative replay timers accumulate timing drift after event-loop delays | Medium | **Reproduced under deliberate event-loop blocking** | Not fixed |
| F-03 | FIFO voice stealing stops and disconnects the oldest oscillator abruptly | Medium | **Confirmed code path**; audible artifact not yet verified | Not fixed |

**Current source verification:** F-01 through F-03 were evaluated against the submitted ZIP. Automated tests in the student environment should be rerun after each repair; no post-fix verification is claimed in this report.

### Relationship to the instructor's slide

- **Failure mode 1 — Redundant `useEffect` for derived state:** No clear matching `useEffect` anti-pattern was established in the inspected HW2 source. Do not invent one as an observed bug.
- **Failure mode 2 — Stale closures in effects and timers:** The inspected `Piano.tsx` uses `useCallback` and effect cleanup. A specific stale-closure failure was **not demonstrated**. Do not call this confirmed without a failing reproduction.
- **Failure mode 3 — Missing AbortController/audio cleanup:** **F-01** demonstrates incomplete cancellation despite the presence of `AbortController`.
- **Failure mode 4 — Naive timer drift:** **F-02** demonstrates drift from sequential relative timeouts; the code uses `setTimeout`, not the exact `setInterval` example on the slide.
- **Additional integrity check:** **F-03** addresses audio lifecycle quality.

## 2. Findings and remediation

### F-01 — Stop Replay does not finish if `noteOn()` remains pending

**Severity:** High  
**Category:** AbortController / asynchronous cleanup  
**Source:** `app/src/sequencer/ReplayScheduler.ts`, approximately lines 109–155 and 172–187.

**Root cause:** `stop()` aborts the session, but `play()` still awaits `Promise.all(starts)` in both the normal and error paths. A `starts` promise waits for `callbacks.noteOn(...)`. If that external asynchronous call never resolves, the replay promise never settles and `session` is never reset to `null`.

**How to recognize it:** Pressing **Stop Replay** may leave the app in a "stopping"/"playing" state with Replay disabled. A slow or indefinitely suspended audio startup is one possible trigger. Ordinary successful `noteOn()` calls will not show this failure.

**Reproduction performed on the extracted source:** A test invoked `scheduler.play()` with a `noteOn` callback returning `new Promise(() => {})`, then called `scheduler.stop()`. After a further 25 ms, the recorded result was:

```text
{"scenario":"Stop while noteOn never resolves","starts":1,"replayPromiseSettled":false,"isPlaying":true}
```

**How to reproduce in DevTools:**

1. In a **temporary local test harness** (not in production code), make `noteOn()` return a pending Promise.
2. Start a replay and invoke Stop.
3. Inspect `scheduler.isPlaying` or the Replay/Stop button states using React DevTools.
4. Verify that the replay never reaches its completion/abort handler. Save a screenshot of this **before-fix** state.

**Manual repair:**

1. Make waits for pending `noteOn` promises **abort-aware**; the current abortable `delay()` is not sufficient.
2. Race the wait for all `starts`/`releases` against an abort notification, and **do not await an unresolved `Promise.all(starts)` inside the `catch` branch**.
3. Preserve the existing late-result guard: after an aborted `noteOn()` eventually resolves, immediately call `callbacks.noteOff(voiceId)`.
4. Remove abort listeners after settlement; avoid orphaned rejections.
5. Prefer adding an `AbortSignal` contract to downstream audio initialization when feasible.

A helper pattern for the affected waits (integrate carefully; do not paste as a standalone replacement for the class):

```ts
function waitOrAbort<T>(task: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Replay cancelled', 'AbortError'));
      return;
    }

    const onAbort = () => {
      signal.removeEventListener('abort', onAbort);
      reject(new DOMException('Replay cancelled', 'AbortError'));
    };

    signal.addEventListener('abort', onAbort, { once: true });
    task.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener('abort', onAbort);
        reject(error);
      },
    );
  });
}
```

**Acceptance criteria after repair:** Stopping a replay rejects with `AbortError` promptly even when `noteOn()` is still pending; `scheduler.isPlaying` becomes `false`; pressing Replay again works; a late `noteOn()` result is safely released. Add an automated regression test for this exact deferred-Promise case.

**Evidence to attach:** `evidence/f01-before.png`, `evidence/f01-after.png`, failing-then-passing test output, and the fix commit hash. **Not supplied yet.**

### F-02 — Replay onset times drift after delayed event-loop execution

**Severity:** Medium  
**Category:** Timer scheduling / audio precision  
**Source:** `app/src/sequencer/ReplayScheduler.ts`, approximately lines 98–107.

**Root cause:** The worker waits `note.deltaMs / speed` **relative to the end of each previous wait**, instead of scheduling against one monotonic start timestamp. Browser timer throttling, other JavaScript work, or delayed callbacks can accumulate lateness across a sequence.

**How to recognize it:** A melody replays progressively late, particularly under CPU load or after switching tabs. Playback speed may be roughly correct in ideal conditions while longer sequences drift.

**Reproduction performed on the extracted source:** Three note onsets were scheduled with deltas `[0, 20, 20]` milliseconds. The first `noteOn()` deliberately blocked the event loop for about 90 ms. Measured onset times were:

```text
Expected ideal onsets: 0 ms, 20 ms, 40 ms
Observed in probe:     1 ms, 93 ms, 114 ms
```

The second note cannot be played retroactively; however, the third relative delay adds further avoidable lateness instead of catching up to the original schedule.

**How to reproduce in DevTools:**

1. Record several notes with short, regular intervals.
2. Open Chrome DevTools → **Performance**, record a replay, and introduce significant main-thread work (or CPU throttling where available).
3. Compare each `noteOn` timestamp with its expected cumulative `deltaMs / speed` timestamp. Log or mark measurements during diagnosis only.
4. Capture the before-fix trace. Do not present the synthetic Node.js values above as a Chrome Performance trace.

**Manual repair:** Anchor each note onset to a monotonic clock:

```ts
const replayStartedAt = performance.now();
let targetElapsedMs = 0;

for (const note of notes) {
  targetElapsedMs += note.deltaMs / speed;
  const elapsedMs = performance.now() - replayStartedAt;
  const remainingMs = Math.max(0, targetElapsedMs - elapsedMs);

  if (remainingMs > 0) {
    await delay(remainingMs, signal);
  }
  if (signal.aborted) throw abortError();

  // Preserve the existing non-blocking noteOn scheduling here.
}
```

For tighter musical timing, schedule future oscillator starts against `AudioContext.currentTime` where the synth interface permits it. A JavaScript timer alone is not sample-accurate.

**Acceptance criteria after repair:** Tests comparing planned onset times with actual onsets show no additional *cumulative* delay introduced by the next relative timeout; 0.5×, 1×, and 2× durations remain consistent; FIFO ordering and chords still work.

**Evidence to attach:** `evidence/f02-performance-before.png`, `evidence/f02-performance-after.png`, timing assertions, and fix commit hash. **Not supplied yet.**

### F-03 — Abrupt FIFO voice stealing can produce audio clicks

**Severity:** Medium  
**Category:** Audio resource lifecycle  
**Source:** `app/src/audio/PolyphonicSynth.ts`, approximately lines 44–65.

**Root cause:** `stealOldestVoice()` calls `voice.oscillator.stop()` and disconnects both nodes immediately. It does not use the 120–140 ms release envelope implemented separately by `noteOff()` (approximately lines 145–175). Stopping a waveform away from a zero crossing can cause an audible discontinuity.

**How to recognize it:** When holding eight simultaneous notes and triggering a ninth, a short click/pop may occur as the oldest voice is stolen. This is **a source-confirmed abrupt-stop risk**, not an audibly verified defect yet.

**How to reproduce in DevTools:**

1. Use a temporary test harness to sustain eight voices, then start a ninth; ordinary mouse input may not easily sustain nine notes.
2. Check that the oldest oscillator is stopped synchronously; the supplied mocked Web Audio test already checks the FIFO order but not waveform smoothness.
3. If a click is heard, use DevTools' audio-related inspection (when available) or record the output waveform with an external audio capture tool. Keep listening volume moderate.
4. Save a before-fix recording or screenshot and describe what was actually observed.

**Manual repair:** Use a brief gain ramp to near zero **before** stopping the stolen oscillator. Because the assignment requires a strict maximum of eight simultaneous voices, explicitly choose a policy: reuse the oldest voice after the ramp, or finish its short fade before starting a replacement. Starting a ninth oscillator while the old one is still sounding would violate the strict physical eight-voice cap. Add tests for both voice count and replacement behavior.

**Acceptance criteria after repair:** FIFO order remains correct; no more than eight audible/active voices exist under the chosen policy; the abrupt-stop artifact is reduced or absent in a listening comparison; `noteOff()` and `dispose()` still clean up all nodes.

**Evidence to attach:** `evidence/f03-audio-before.*`, `evidence/f03-audio-after.*`, verification of voice counts, and fix commit hash. **Not supplied yet.**

## 3. Test and evidence protocol (mandatory for instructor submission)

For **at least three** findings that you actually fix, retain a traceable record:

1. **Before:** reproduction steps, exact error or unexpected behavior, DevTools/Test Explorer/console screenshot, and source file/line.
2. **Manual fix:** changed file, brief code diff, reason for the change, and Git commit hash.
3. **After:** same scenario re-run, screenshot showing the corrected behavior, passing targeted regression test, and `npm run build`/`npm run lint` results.
4. **Accessibility:** where the fix touches controls or status, check keyboard operation, visible focus, accessible labels, and screen-reader announcements against WCAG 2.2 AA. An automated score alone does not prove conformance.

Suggested folder layout:

```text
Homework_2/
├── ai_failure.md
├── evidence/
│   ├── f01-before.png
│   ├── f01-after.png
│   ├── f02-performance-before.png
│   ├── f02-performance-after.png
│   ├── f03-audio-before.wav       # Only if actually captured
│   └── f03-audio-after.wav        # Only if actually captured
└── app/
```

### Resolution checklist

- [ ] F-01: Abort-aware replay completion fixed; regression test passes.
- [ ] F-02: Absolute-clock onset scheduling implemented; drift comparison recorded.
- [ ] F-03: Audio stealing policy improved and verified by listening/voice-count tests.
- [ ] At least three **fixed** findings have authentic before/after evidence.
- [ ] `npm run test`, `npm run build`, and `npm run lint` succeed in the student's environment.
- [ ] Code and evidence are committed to the **Lab 3** repository only.

## 4. Verification scope and limitations

- **Inspected:** The actual `Homework_2` source files and available test files inside the uploaded ZIP.
- **Reproduced outside the browser:** F-01 (`isPlaying=true` after `stop()` with a permanently pending `noteOn` promise) and F-02 (timing drift under deliberately blocked event-loop execution) using Node.js with TypeScript type stripping.
- **Confirmed by static inspection:** F-03 abrupt oscillator stop/disconnect.
- **Not performed:** Live Chrome DevTools capture, hands-on audio listening, manual source edits to the student's repository, post-fix validation, or a full Windows build/test run.
- **Local runtime limitation:** Attempting Vitest from the uploaded Windows `node_modules` in the Linux audit container failed because the platform-specific Rolldown native binding was not present. This is an environment mismatch, **not evidence that the student's project tests fail on Windows**.
- **No fabricated proof:** Screenshots, completed checkboxes, and commit hashes must be added only after the student performs the repairs and captures real results.

## 5. Suggested commit sequence

```powershell
# After repairing and verifying F-01
git add Homework_2/
git commit -m "fix(hw2): make replay cancellation abort-safe"
git push

# After repairing and verifying F-02
git add Homework_2/
git commit -m "fix(hw2): anchor replay scheduling to a monotonic clock"
git push

# After repairing and verifying F-03
git add Homework_2/
git commit -m "fix(hw2): smooth FIFO voice release"
git push
```

**Final audit state:** Three findings documented; **zero fixes verified** in this uploaded snapshot. Update each finding's status only after applying and retesting the correction.
