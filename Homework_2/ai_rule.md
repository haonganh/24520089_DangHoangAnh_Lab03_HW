# AI Rules — Lab 3 Homework 2

**Project:** 88-Key Polyphonic Piano & Concurrent FIFO Sequencer  
**Primary requirements:** Instructor's two HW2 slides, React + TypeScript, Lab 2 HW2 FIFO reuse, Lab 2 Slide 21 memoization, WCAG 2.2 Level A/AA.  
**Workflow:** Step-by-step guidance aligned with `task_decomposition.md`, with verification and a Git commit for each completed task.

## 1. Mission and non-negotiable boundaries

The AI must help implement an independently runnable `Homework_2/app` **inside the existing Lab 3 Git repository**. Lab 2 is a **read-only reference**. Homework 1 must not be changed to accommodate HW2.

- **MUST** follow the two supplied Lab 3 HW2 assignment slides. Distinguish explicit slide requirements from optional architecture recommendations.
- **MUST** work in task-ID order (`T01`, `T02`, …), with short, reproducible instructions when requested.
- **MUST** review the original Lab 2 HW2 code before claiming a component, algorithm or method is reused.
- **MUST NOT** write Lab 3 code in Lab 2's repository, create nested `.git` folders, or import Lab 2 source via machine-specific absolute paths.
- **MUST** preserve existing features/tests; use minimal edits and do not overwrite entire files unnecessarily.
- **MUST** ask for a relevant error log when essential, but otherwise use the provided context and proceed without repeated clarifications.
- **MUST** distinguish implementation from verified results; never assert “WCAG compliant,” “100 Lighthouse,” “all tests pass,” or “88 keys don't re-render” without measurement.
- **MUST** explain how to reproduce, fix, and retest each discovered failure, with an impact/severity assessment. An optional later `ai_failure.md` must report verified facts and uncertainties separately.

## 2. Verified Lab 2 HW2 reuse rules

The supplied Lab 2 HW2 ZIP contains these source files:

- `Homework_2/app/src/audio/audio-task.ts`
- `Homework_2/app/src/audio/audio-queue-controller.ts`
- `Homework_2/app/src/audio/audio-queue-controller.test.ts`
- `Homework_2/app/src/audio/audio-playback-engine.ts`
- `Homework_2/app/src/components/AudioVisualizer.tsx`

**The Lab 2 `AudioTaskQueue` serializes `fetch` + `decodeAudioData` of track URLs.** Its `enqueue(trackUrl): Promise<AudioBuffer>` API is not an oscillator melody scheduler. Therefore:

1. **MUST** separate three concerns: (a) FIFO loading/decoding patterns learned from Lab 2, (b) FIFO note-event replay, and (c) FIFO stealing of the oldest active oscillator voice.
2. **MUST** adapt proven Lab 2 concepts where relevant: one-worker processing, insertion-order FIFO, per-task `AbortController`, settled-once promise handling, `cancelTask`/`cancelAll` semantics, disposal, late-result guards, and corresponding tests.
3. **MUST NOT** copy the Lab 2 download-queue class unchanged and present it as a completed piano replay scheduler.
4. **MUST** preserve provenance in README: exact original file/method, target file/method, whether logic was copied or adapted, changes made, and evidence/tests.
5. **SHOULD** reuse safely isolated lifecycle techniques from `audio-playback-engine.ts`, but **MUST NOT** reuse its single-source buffer playback assumption as if it supported eight oscillators simultaneously.
6. **MUST** independently install dependencies in `Homework_2/app` and keep Lab 3 self-contained.

## 3. Algorithmic 88-key specification

- **MUST** generate notes mathematically from MIDI 21 to 108 inclusive. No manual list of 88 key objects.
- **MUST** use `440 * 2 ** ((midi - 69) / 12)` Hz and calculate octave via `Math.floor(midi / 12) - 1`; verify A0, A4 (MIDI 69, 440 Hz), C4 (MIDI 60, ~261.626 Hz), and C8.
- **MUST** derive black-key status from C-based pitch classes: 1, 3, 6, 8, 10; target exactly 52 white and 36 black keys.
- **MUST** use stable MIDI identifiers as React `key` props and keep the note model typed and immutable where practical.
- **MUST** unit-test boundaries, total count, uniqueness, order, note naming and frequency values.
- **MUST NOT** equate a CSS piano illustration with a correct 88-note model; every rendered key must be individually interactive.

## 4. React.memo and rendering-isolation rules

- **MUST** wrap the actual `PianoKey` component in `React.memo` and use its `isPressed` prop (or documented equivalent) to control only the affected key's visual state.
- **MUST** keep `onNoteOn`/`onNoteOff` references stable with appropriate `useCallback`/state architecture; prefer passing the stable handler plus MIDI ID instead of recreating inline per-key functions each parent render.
- **MUST** prevent unrelated global state (recording timer, replay status, audio level, active voice count) from causing avoidable re-renders of all 88 keys.
- **MUST** validate with **React DevTools Profiler** using one controlled key press and release, including rerenders triggered by parent state changes.
- **MUST** distinguish initial mount, React Strict Mode development behavior, actual component render, and browser painting; do not assume `memo` guarantees zero renders forever.
- **MUST NOT** write custom `arePropsEqual` that ignores changed accessibility or behavior props; a false-positive equality optimization can create stale UI.
- **SHOULD** document the profiler procedure and include actual screenshots/evidence in `evidence/`.

## 5. Polyphonic synthesis and voice stealing

- **MUST** use real Web Audio oscillators (or another explicitly justified synthesis engine) for the polyphonic piano, rather than one HTML `<audio>` element per active voice.
- **MUST** create/resume `AudioContext` safely after user interaction and provide a safe initial master gain/volume.
- **MUST** track **at most 8 active voices** with FIFO insertion order; the ninth distinct note steals/releases the oldest tracked active voice.
- **MUST** use a click-reducing envelope with short attack/release; Web Audio exponential gain ramps cannot target zero, so use a positive floor such as `0.0001` followed by `osc.stop()` and disconnection.
- **MUST** distinguish actively held/tracked voices from oscillators in short release tails. If the implementation permits brief release overlap, document and bound it; do not falsely assert a hard limit on physically sounding oscillators if only tracked voices are capped.
- **MUST** handle duplicate/retriggered MIDI notes without stale `onended` callbacks removing newer voices.
- **MUST** handle `pointercancel`, lost capture, window blur, visibility change, Stop and unmount without stuck notes.
- **MUST** catch audio resume/node errors and show readable feedback; avoid dangerously loud default volume and minimize clipping.
- **MUST** test 8 notes, 9th note, release, retrigger, rapid sequences and disposal with deterministic mocks.

## 6. Recording, FIFO replay and cancellation

- **MUST** record typed note data containing at least `{ midi, freqHz, durationMs, deltaMs }` with monotonic timing; note-on and note-off must be paired.
- **MUST** define exact meaning of `deltaMs` (time since the **previous note onset**) and how chords or same-time events are represented; allow zero deltas.
- **MUST** preserve user note order and overlaps; do not force sequential playback that destroys simultaneous chords.
- **MUST** keep pitch unchanged when replay speed changes; scale **inter-onset delay and note duration** by `1 / speed` for 0.5x/1x/2x.
- **MUST** protect replay from duplicate starts, premature unmount, pending delayed tasks and race conditions.
- **MUST** use `AbortController` and abort-aware cancellation for each replay session. Since `abort()` does not automatically clear timers, clear scheduled timeouts and reject/resolve waits on abort explicitly.
- **MUST** make Stop cancel the current replay, prevent later note starts, and silence all replay-controlled active voices; ensure cancellation is idempotent.
- **MUST** avoid swallowing genuine playback errors as cancellation. Expected `AbortError` is not a user-visible app crash.
- **MUST** ensure a new replay cannot be affected by late callbacks from a previous session (generation token/session ID or equivalent).
- **MUST** unit-test FIFO, 0.5x/1x/2x timing, chord overlap, empty recording, Stop during a wait, Stop during a sounding note and unmount cleanup.

## 7. Accessible piano controls and WCAG 2.2 AA

### 7.1 Semantics, focus and keyboard

- **MUST** use accessible native buttons or an equally well-tested semantic control pattern for piano keys. Every note must have an accessible name containing its note identifier (such as “C4, MIDI 60”).
- **MUST** enable every key and transport action via keyboard, with **no keyboard trap** (WCAG 2.1.1 and 2.1.2).
- **MUST** design 88-key focus navigation deliberately: roving `tabIndex` and arrow keys is allowed if correctly implemented; keep Tab as an exit path, reveal focused keys in the scrolling region, and provide instructions.
- **MUST** support normal Enter/Space activation without duplicate playback caused by mixing `keydown`, `onClick`, and pointer handlers. Keep momentary note-off semantics correct for keyboard and pointer users.
- **MUST** avoid hijacking OS/browser/assistive-technology shortcuts, IME composition, or input typing. If character-only shortcuts are added, scope them to the relevant focused component or provide off/remap per **WCAG 2.1.4**.
- **MUST** make focus visible and not fully obscured (WCAG 2.4.7, 2.4.11); focus must be recoverable after Start/Stop/replay updates.
- **MUST** use `aria-pressed` only for *truthful toggle-button state*. A held piano note is normally a momentary action; the instructor's `aria-pressed={isPressed}` snippet must be reconciled with correct WAI-ARIA semantics and the grading rubric, not copied blindly.
- **MUST** include the visible note label in its accessible name (WCAG 2.5.3). Do not use misleading roles or unsupported ARIA attributes.

### 7.2 Information and non-audio feedback

- **MUST** provide visible Record/Replay/Stop/speed status and errors so hearing is not required to know the current state.
- **MUST** provide a polite, concise status announcement when a significant state changes (recording started/stopped, replay stopped, error), without announcing all oscillator samples or flooding a live region.
- **MUST** use explicit labels and clear disabled states for transport controls; do not infer state only from color.
- **MUST** respect the user's reduced-motion preference and avoid flashing effects.
- **MUST** ensure audio does not start unexpectedly; provide an easy Stop and/or Mute for sustained playback.

### 7.3 Layout, contrast and target size

- **MUST** meet contrast ≥ 4.5:1 for normal text and ≥ 3:1 for large text (WCAG 1.4.3 AA).
- **MUST** meet non-text contrast ≥ 3:1 for essential boundaries/focus/pressed-state cues where 1.4.11 applies.
- **MUST** meet **WCAG 2.5.8** target size: at least 24×24 CSS px, or an actually applicable documented exception; aim for larger touch targets when feasible, especially black keys.
- **MUST** keep global page content usable at 320 CSS px-equivalent width/400% zoom, 200% text resizing and increased text spacing.
- **MAY** allow localized horizontal scrolling of the instrument when its spatial keyboard layout genuinely needs it, with a written justification under WCAG 1.4.10; this is **not** permission for unrelated page content to overflow.
- **MUST** preserve readable labels and operable piano keys in `forced-colors: active` (Windows High Contrast Mode).
- **MUST** test focus and pointer access when black keys overlay white keys; no visually hidden keys should be left interactive but unreachable.

## 8. Code quality and lifecycle rules

1. **Use TypeScript types** for MIDI notes, voices, note events, recording status and replay tasks. Avoid `any` and unsafe type casts without justification.
2. **Separate layers:** pure MIDI math, memoized key UI, synth, active voice manager, event recorder, abortable replay queue and transport controls.
3. **Keep React state minimal:** Web Audio nodes, timers and AbortController handles belong in refs/services rather than re-rendering state.
4. **Clean up resources:** stop/disconnect oscillators, close/suspend contexts as appropriate, remove listeners and timers, abort pending work; avoid state updates after unmount.
5. **Honor React Strict Mode:** lifecycle effects should be idempotent and not produce double sounds or double queue workers.
6. **Do not replace settled-once semantics with hanging promises.** Every pending task must finish, cancel or reject predictably.
7. **Do not add unrelated dependencies** or copy old unused files into HW2. Keep the project reviewable.
8. **No secrets or machine paths:** ignore `node_modules/`, `dist/`, `.env` and private data, and never require local Lab 2 files at runtime.

## 9. Mandatory tests and verification

| Area | Evidence required |
|---|---|
| Piano model | Unit tests for 88/52/36 keys, MIDI range, note naming, 440 Hz reference and other frequencies. |
| React memo | React DevTools Profiler trace of one-key press/release and parent rerender; show unaffected keys skipped. |
| Voice pool | Tests for 8 voices, 9th FIFO steal, voice release/retrigger and cleanup. |
| FIFO replay | Fake-timer tests for event order, chord timing, 0.5x/1x/2x, Stop/AbortController, pending cleanup. |
| Accessible controls | Keyboard-only, pointer, screen-reader role/name/focus tests and no shortcut capture in text inputs. |
| Visual WCAG | Contrast checks, focus visibility, target sizes, 320px/zoom/reflow, reduced motion and forced colors. |
| Quality | `npm run test`, `npm run lint`, `npm run build` and preview smoke test; record real results. |
| External accessibility audits | axe DevTools + Lighthouse Accessibility on production build; manually verify what automation cannot detect. |

- **MUST NOT** mark a task complete merely because TypeScript compiled or a screenshot looks correct.
- **MUST NOT** treat Lighthouse 100 as sufficient proof of full WCAG 2.2 AA conformance.
- **MUST** mark incomplete or not-yet-run checks `Not verified`, rather than fabricating a `Pass`.

## 10. AI assistance protocol — step-by-step, Git and documentation

For every `Txx` task:

1. **Identify the task and goal** from `task_decomposition.md`.
2. **Give concise executable steps** with exact Windows PowerShell paths/commands where useful. Prefer a few focused edits over rewriting unrelated files.
3. **Name the files to change** and why; for migrated Lab 2 logic, cite the corresponding original method/file.
4. **Explain any WCAG impact** (semantics, keyboard, focus, feedback, target size or reflow).
5. **Implement/test the single task** and show what a genuine pass looks like. Do not claim to have run commands that were not executed.
6. **Fix errors before committing.** Explain root cause, recognition symptoms and retest steps; preserve regression tests.
7. **Update only verified `[ ]` items** in the task file to `[x]`.
8. **Commit and push using scoped Conventional Commits** in the Lab 3 repo, for example:
   - `chore(hw2): initialize project and T01`
   - `docs(hw2): document Lab 2 FIFO reuse contract`
   - `feat(hw2): generate 88-key MIDI model`
   - `feat(hw2): implement FIFO voice stealing`
   - `feat(hw2): add abortable sequencer replay`
   - `test(hw2): verify rendering isolation and WCAG`
   - `docs(hw2): mark T08 as completed` (when documentation alone changes)
9. **Do not rebase, reset, force-push or rewrite published history** without a clear reason and explicit user approval.
10. **At completion**, prepare README, provenance table, a truthful accessibility audit and actual evidence; retain known limitations.

## 11. Sources and authority hierarchy

1. **Instructor HW2 slides** supplied by the user: functional requirements and code examples.
2. **Original Lab 2 HW2 source** in the user-provided ZIP: primary evidence of what can be reused.
3. **W3C WCAG 2.2 specification:** https://www.w3.org/TR/WCAG22/
4. **W3C Understanding 1.4.10 Reflow:** https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
5. **W3C Understanding 2.5.8 Target Size (Minimum):** https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
6. **W3C Understanding 2.1.4 Character Key Shortcuts:** https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html
7. **React `memo` documentation:** https://react.dev/reference/react/memo
8. **MDN Web Audio API:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
9. **MDN AbortController:** https://developer.mozilla.org/en-US/docs/Web/API/AbortController

**Resolution of conflicts:** Follow the instructor's actual rubric for assignment scope, but do not knowingly introduce false accessibility claims. If an illustrative slide snippet conflicts with WAI-ARIA semantics or safe Web Audio practice, explain the trade-off and provide the most faithful accessible implementation, clearly recording any deviation.
