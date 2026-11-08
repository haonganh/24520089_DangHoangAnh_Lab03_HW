# Lab 3 — Homework 2: Task Decomposition

**Assignment:** 88-Key Polyphonic Piano & Concurrent FIFO Sequencer  
**Target:** React + TypeScript; applicable WCAG 2.2 Level A/AA success criteria  
**Estimated work period:** 1 week (the slide's “HOMEWORK 2 | 1 WEEK” timebox)  
**Status:** Not started — update checkboxes only after verification  
**Repository:** Existing independent Lab 3 repository, inside `Homework_2/`; do **not** modify or develop inside the Lab 2 repository.

> **Scope of the instructor's slides:** Combine Legacy Slide 27 (88-key piano), Lab 2 Slide 21 (`memo`/shallow comparison), and Lab 2 HW2 (FIFO audio queue). Generate 88 MIDI keys algorithmically; support up to eight concurrent voices with FIFO stealing and click-free release; provide recording plus 0.5x/1x/2x replay; cancel replay on Stop/unmount; prove `PianoKey` render isolation with React DevTools Profiler. The file structure, test tooling, and accessibility implementation details below are recommended engineering decisions, not additional slide requirements.

## 1. Functional contract and scope

- [ ] Generate exactly **88 keys**, MIDI **21 (A0)** through **108 (C8)** inclusive, with **52 white** and **36 black** keys; do not hardcode an array of 88 objects.
- [ ] Generate pitch with `frequencyHz = 440 * 2 ** ((midi - 69) / 12)`; name notes from pitch classes and octave calculation `Math.floor(midi / 12) - 1`.
- [ ] Render 88 reusable `PianoKey` components wrapped in `React.memo`; only the changed key(s) should re-render due to the pressed-state change. Verify with **React DevTools Profiler**, not assertion alone.
- [ ] Use Web Audio oscillators with a **maximum of eight tracked active voices** and FIFO (oldest-first) voice stealing on the ninth distinct active note.
- [ ] Apply short gain envelope ramps (e.g., release around 40 ms) to reduce audio clicks. Explicitly define whether releasing voices count toward the physical oscillator budget; avoid misleading claims that “eight tracked voices” always means “no ninth oscillator during a release tail.”
- [ ] Record a sequence of typed note events with `{ midi, freqHz, durationMs, deltaMs }` (and a stable ID if needed). Track note-on and note-off times correctly; chords and repeated notes must not lose events.
- [ ] Replay recorded notes in **FIFO event order** at **0.5x, 1x, and 2x**. Scale delays **and note durations** by the selected speed, but keep pitch/frequency unchanged.
- [ ] Clicking **Stop** or unmounting immediately aborts the scheduled replay, rejects/resolves pending work predictably, and silences active replay voices.
- [ ] All primary actions work with keyboard and pointer input and meet applicable **WCAG 2.2 A/AA** criteria. Audio alone is never the only indication of state.
- [ ] Document which Lab 2 HW2 files and algorithms were reused/adapted and why. HW2 must be independently runnable from the Lab 3 checkout.

### Important distinction: two different FIFO mechanisms

1. **FIFO audio task queue (Lab 2 HW2):** Serializes downloading/decoding audio files through `AudioTaskQueue.enqueue(trackUrl)`, supports per-task cancellation, `cancelAll()`, status, and disposal.
2. **FIFO voice stealing (Lab 3 HW2):** Removes the **oldest active synthesizer voice** when a new note would exceed the eight-voice limit. It is not an asynchronous download queue.
3. **FIFO sequence replay (Lab 3 HW2):** Consumes recorded note events in order at scheduled times. Reuse the *queue/cancellation engineering patterns* from Lab 2 HW2, but **adapt the payload and timing model**. Do not claim the old `enqueue(trackUrl): Promise<AudioBuffer>` API directly implements melody replay.

## 2. Source-to-target reuse map (verified against the supplied Lab 2 HW2 ZIP)

| Existing Lab 2 HW2 source | Verified role in Lab 2 | Reuse decision for Lab 3 HW2 |
|---|---|---|
| `Homework_2/app/src/audio/audio-task.ts` | `AudioTask` and `AudioQueueStatus` interfaces for audio downloads | **Adapt** types to recorded note/replay tasks; preserve explicit cancellation/status concepts. |
| `Homework_2/app/src/audio/audio-queue-controller.ts` | `AudioTaskQueue`, single FIFO worker; `enqueueTask()`, `cancelTask()`, `cancelAll()`, `getStatus()`, `dispose()` | **Adapt** FIFO order, one-worker invariant, settled-once behavior, abort and cleanup patterns into replay scheduler. Its `fetch` and `decodeAudioData` are not needed for oscillator replay. |
| `Homework_2/app/src/audio/audio-queue-controller.test.ts` | FIFO ordering, failure recovery, queued-task cancellation and late-result cancellation tests | **Adapt** test scenarios to sequencer notes, timing, Stop and unmount semantics. |
| `Homework_2/app/src/audio/audio-playback-engine.ts` | `AudioContext` lifecycle, GainNode and resource cleanup for buffer playback | **Reference/reuse selected ideas**; use a new polyphonic oscillator synthesizer rather than blindly copying the single-source playback model. |
| `Homework_2/app/src/components/AudioVisualizer.tsx` | Frequency visualization, animation/reduced-motion and cleanup patterns | **Optional** for a visualization; not required for the piano core. |
| Lab 2 Slide 21 | React memoization with shallow prop comparison | **Apply** `React.memo`, stable handlers and props to 88 `PianoKey` instances. |

**Reuse evidence to include in the final README:** source file → adapted target file, copied or reworked elements, changed behavior, and linked tests. Copy **only** needed source into `Homework_2/app/`; do not reference absolute filesystem paths into Lab 2.

## 3. Proposed project structure

```text
Lab03_Repo/
├── Homework_1/                     # Completed HW1; leave untouched
├── Homework_2/
│   ├── task_decomposition.md
│   ├── ai_rule.md
│   ├── README.md                    # Final documentation (T14)
│   ├── accessibility_audit.md      # Actual audit results (T13)
│   ├── evidence/                    # Actual screenshots/profiler evidence
│   └── app/
│       ├── src/
│       │   ├── piano/
│       │   │   ├── notes.ts          # Algorithmic MIDI note generation
│       │   │   └── notes.test.ts
│       │   ├── audio/
│       │   │   ├── PolyphonicSynth.ts
│       │   │   ├── PolyphonicSynth.test.ts
│       │   │   ├── ReplayTaskQueue.ts
│       │   │   └── ReplayTaskQueue.test.ts
│       │   ├── components/
│       │   │   ├── PianoKey.tsx
│       │   │   ├── PianoKeyboard.tsx
│       │   │   └── SequencerControls.tsx
│       │   ├── hooks/
│       │   │   └── usePiano.ts
│       │   ├── App.tsx
│       │   ├── App.css
│       │   └── index.css
│       └── package.json
└── Homework_3/                     # Created later, when assigned
```

**Note:** Proposed names/organization, not compulsory. Existing Lab 3 Git root should remain the only `.git` for the three Homework folders.

## 4. Work breakdown — implement one task at a time

### Phase 0 — Preparation, traceability, migration (Day 1)

#### T01 — Initialize HW2 without changing HW1 (Critical)
- [x] Confirm Git root and `origin` point to the Lab 3 repository.
- [x] Create `Homework_2/app` with a **separate** React + TypeScript + Vite project; `npm install` completes.
- [x] Add `Homework_2/task_decomposition.md` and `Homework_2/ai_rule.md` before writing feature code.
- [ ] Verify `npm run dev`, `npm run build`, and `npm run lint`; configure `npm run test` when test dependencies are installed.
- [x] Confirm `Homework_1/` is unchanged and Lab 2 was not edited.

**Acceptance:** HW2 runs independently; Git history/remote belong only to Lab 3.  
**Suggested commit:** `chore(hw2): initialize standalone React TypeScript app and plans`

#### T02 — Audit and adapt the Lab 2 FIFO code (Critical)
- [x] Read the exact five Lab 2 HW2 audio source/test files identified in the reuse map.
- [x] Record existing APIs: `enqueue(trackUrl)`, `enqueueTask()`, `cancelTask()`, `cancelAll()`, `getStatus()`, `dispose()`.
- [x] Identify reusable FIFO invariants, cancellation, settled-once, abort, lifecycle, and tests.
- [x] Design **typed note replay tasks**, which are not URLs/buffers, and choose an explicit cancellation/scheduling API.
- [x] Add a short `Lab 2 → Lab 3` migration note in the README draft (avoid unsupported claims of direct code reuse).
- [x] Add a regression plan for FIFO order, stop, unmount, and stale async completions.

**Acceptance:** A written mapping exists from source methods to target behavior; no inappropriate `fetch`/decode coupling remains in the intended synth replay design.  
**Suggested commit:** `docs(hw2): map Lab 2 FIFO queue reuse and replay contract`

### Phase 1 — Piano contract and renderer (Days 1–2)

#### T03 — Generate the mathematical 88-key model (Critical)
- [x] Implement MIDI range **21–108**, frequencies with 12-tone equal temperament (A4 = 440 Hz).
- [x] Derive note names/octaves; determine black/white keys from pitch classes, not a hardcoded 88-entry list.
- [x] Assert exactly **88 notes, 52 white, 36 black**, with unique MIDI IDs, ascending order, A0 first and C8 last.
- [x] Unit-test a few frequency checks: MIDI 69 = 440 Hz; MIDI 60 ≈ 261.626 Hz; endpoints valid.

**Acceptance:** Pure model generates the correct 88 notes consistently with no runtime audio dependency.  
**Suggested commit:** `feat(hw2): generate typed 88-key MIDI model`

#### T04 — Build accessible `PianoKey` and `PianoKeyboard` (Critical)
- [x] Render all 88 keys in correct black/white piano arrangement, with no overlapping controls that become unreachable.
- [x] Use stable `key={midi}` and native buttons with a descriptive accessible name (e.g., “C4, MIDI 60”).
- [x] Wrap `PianoKey` with `React.memo` and keep props/handlers referentially stable; do not allocate per-key callback functions in the parent render unless memoization remains effective.
- [x] Convey pressed state visually using shape, border, or text as well as color; do not misuse `aria-pressed` as a substitute for momentary note-on/off semantics.
- [x] Plan a practical focus strategy for **88 keys** (e.g., one Tab entry point + arrow-key navigation/roving `tabIndex`, with clear instructions); preserve Enter/Space activation and accessible focus.
- [x] Make the keyboard horizontally scrollable **within its own region** when necessary; keep controls/instructions reflowing elsewhere.

**Acceptance:** All 88 note buttons are present, identifiable and operable via keyboard and pointer; visual keyboard order/scrolling are understandable.  
**Suggested commit:** `feat(hw2): implement memoized accessible 88-key keyboard`

### Phase 2 — Sound and polyphonic voice management (Days 2–3)

#### T05 — Implement the Web Audio synthesizer (Critical)
- [x] Create/resume `AudioContext` on a user interaction; define one safe master gain.
- [x] Implement `noteOn(midi, frequencyHz)` and `noteOff(midi)` (or a consistent voice-ID model).
- [x] Use oscillator + gain envelope per voice with **short attack and release**, including `exponentialRampToValueAtTime` using a **strictly positive** endpoint (e.g., `0.0001`, never 0).
- [x] Track node connections and stop/disconnect in `onended` and `dispose()`; no lingering oscillators.
- [x] Define behavior for repeated notes, concurrent pointers, and audio context failures; expose readable, non-audio error feedback.

**Acceptance:** Multiple notes can sound together; normal releases are smooth, and resources are cleaned up.  
**Suggested commit:** `feat(hw2): implement click-safe polyphonic oscillator synth`

#### T06 — Enforce the eight-voice FIFO ceiling (Critical)
- [x] Use insertion-ordered `Map` or an equivalent queue for active voice order; retrieving the oldest entry is O(1) for an ES6 Map iterator.
- [x] When a ninth *distinct active* note starts, steal/release the **oldest** active voice first.
- [x] Define/reconcile tracked active voices versus oscillators completing a short release tail; prevent unbounded release tails.
- [x] Handle retrigger of the same MIDI note without deleting a newer voice from an older `onended` callback.
- [x] Test 1–8 voices, 9th voice steal, off-order note release, retrigger, Stop/all-notes-off, and 20+ rapid notes.

**Acceptance:** Tracked active voices never exceed eight; FIFO victim is deterministic; no stuck notes or uncontrolled oscillator accumulation.  
**Suggested commit:** `feat(hw2): enforce eight-voice FIFO stealing`

#### T07 — Wire pointer and keyboard play safely (High)
- [ ] Implement pointerdown/note-on and pointerup/pointercancel/lostpointercapture/note-off as applicable.
- [ ] Maintain keyboard operation (Tab + Enter/Space, or a documented arrow-key keyboard pattern) without duplicate note-on from native click/keyboard events.
- [ ] Prevent OS repeat floods, IME conflicts, modifier shortcut interception, and unexpected audio while typing in fields.
- [ ] Keep active-note UI state synchronized on release, blur, visibility changes and unmount.
- [ ] All sound interactions must use a shared typed action path so recording can observe them.

**Acceptance:** Mouse, touch, and keyboard release reliably; no stuck notes, duplicate activations, or keyboard traps.  
**Suggested commit:** `feat(hw2): connect accessible note input and release handling`

### Phase 3 — Recording, ordered replay, cancellation (Days 4–5)

#### T08 — Record note sequences accurately (Critical)
- [ ] Define typed events: `{ midi, freqHz, durationMs, deltaMs }` plus optional stable ID / recorded timestamp.
- [ ] Capture note-on and note-off with a monotonic time source (`performance.now()`); calculate duration and onset delta accurately.
- [ ] Preserve rapid repeated notes, simultaneous/chord onsets (including `deltaMs = 0`), and their event ordering.
- [ ] End/flush notes held when recording stops; define whether Record is allowed during replay.
- [ ] Expose Start/Stop Recording and Clear controls with understandable state/instructions.

**Acceptance:** A recorded melody/chord returns an ordered finite sequence with nonnegative intervals and positive durations; no open/unpaired note remains.  
**Suggested commit:** `feat(hw2): record MIDI note events and timing`

#### T09 — Adapt the Lab 2 FIFO queue into a replay scheduler (Critical)
- [ ] Preserve Lab 2's FIFO process/order, settled-once, task cancellation and one-active-worker design *where relevant*.
- [ ] Implement cancellable inter-note delay using `AbortSignal` **and** explicit timer cleanup. `controller.abort()` alone does not automatically clear `setTimeout`.
- [ ] Schedule or replay ordered note onsets and releases with no blocking UI loops; guarantee chord notes can overlap.
- [ ] Scale both `deltaMs` and `durationMs` by 0.5x/1x/2x speed; pitch stays fixed.
- [ ] Distinguish an expected `AbortError` from a genuine playback failure; ignore late results after Stop.
- [ ] Add unit tests adapted from `audio-queue-controller.test.ts` for FIFO, cancellation, failure recovery and cleanup.

**Acceptance:** Replay preserves note ordering/timing, supports chords, and stops deterministically with no pending timer callbacks that play notes later.  
**Suggested commit:** `feat(hw2): adapt FIFO audio queue for abortable melody replay`

#### T10 — Build accessible sequencer transport controls (High)
- [ ] Implement buttons: Record, Stop Recording, Replay, Stop, Clear; select speed 0.5x, 1x, 2x.
- [ ] Set truthful enabled/disabled states (no Record while replaying if unsupported; no Replay with an empty sequence).
- [ ] Display clear recording/replay status and duration/count as text; keep status updates brief and screen-reader friendly.
- [ ] On Stop or unmount, abort the active replay controller, cancel timers, and silence currently playing replay voices.
- [ ] Test quick Record → Stop → Replay → Stop → Replay, rapid speed changes, and navigating away mid-replay.

**Acceptance:** Every transport control works with a keyboard and pointer; Stop stops *immediately* without stale async playback.  
**Suggested commit:** `feat(hw2): add accessible recording and replay transport`

### Phase 4 — Visual accessibility, tests and delivery (Days 5–7)

#### T11 — Make the piano perceivable and responsive (High)
- [ ] Provide semantic `main`, clear headings, page title and written keyboard/scroll instructions.
- [ ] Keep typical text contrast ≥ **4.5:1**, large text ≥ **3:1**, essential non-text contrast ≥ **3:1**.
- [ ] Ensure the smallest clickable piano keys meet **WCAG 2.5.8** (24×24 CSS px or documented applicable exception); aim for larger touch targets when practical.
- [ ] Provide visible `:focus-visible`, focused-key scroll-into-view behavior if required, and no entirely obscured focus.
- [ ] At 320 CSS px / 400% zoom, content outside the intrinsic 88-key instrument reflows without horizontal page overflow; justify any localized horizontal piano scroll under **WCAG 1.4.10** rather than assuming a blanket exception.
- [ ] Respect `prefers-reduced-motion`, Windows forced colors, 200% text resize and WCAG text-spacing overrides.
- [ ] Use correct status/live semantics without announcing all 88 keys or every animation frame.

**Acceptance:** A keyboard-only and zoomed-in user can reach and operate all keys and transport controls without focus loss.  
**Suggested commit:** `style(hw2): complete WCAG-aware responsive piano layout`

#### T12 — Write deterministic tests (Critical)
- [ ] Test note count, note types and pitch formula, using Vitest.
- [ ] Test piano activation/release with React Testing Library; cover keyboard, pointer cancellation, disabled controls and no double-fire.
- [ ] Mock `AudioContext` nodes; test gain-envelope endpoints, oscillator stop/disconnect and active voice FIFO ordering.
- [ ] Use fake timers to test 0.5x/1x/2x replay timing, chord overlap, AbortController, Stop/unmount and late task cleanup.
- [ ] Test recording durations and note-on/off pairing under repeated/simultaneous notes.
- [ ] Run `npm run test`, `npm run build`, and `npm run lint` with all findings recorded.

**Acceptance:** Unit/integration tests for high-risk behavior pass; tests prove behavior rather than existence of code.  
**Suggested commit:** `test(hw2): cover MIDI generation polyphony and FIFO replay`

#### T13 — Profile rendering and audit accessibility (Critical)
- [ ] Use **React DevTools Profiler** with a controlled one-key press/release; capture evidence that unrelated `PianoKey` instances do not re-render because of that state update.
- [ ] Review that stable `React.memo` props and handlers survive parent record/transport state changes. Account for Strict Mode/development profiling effects; do not claim that React memo *guarantees* no renders under every condition.
- [ ] Run Lighthouse **Accessibility** on `npm run build` + `npm run preview`; record actual desktop/mobile scores. Aim for 100, but the HW2 slides shown do not explicitly require 100 Lighthouse.
- [ ] Run axe DevTools and fix actual findings; record remaining issues.
- [ ] Perform manual WCAG 2.2 A/AA checks: keyboard-only access, screen reader, focus, contrast, target size, zoom/reflow, reduced motion, error/status.
- [ ] Save actual audit results in `accessibility_audit.md` and relevant screenshots/profile traces in `evidence/`.

**Acceptance:** Actual evidence supports performance and accessibility claims; no automated score is presented as proof of full WCAG conformance.  
**Suggested commit:** `test(hw2): document profiler and WCAG accessibility evidence`

#### T14 — Complete documentation and submit (High)
- [ ] Write `Homework_2/README.md`: overview, controls, setup, build, test, recording/replay, design tradeoffs and known limitations.
- [ ] Include an accurate table identifying exactly which Lab 2 HW2 source files/methods/patterns were **copied**, **adapted**, or **referenced**. Explain that voice FIFO and replay FIFO are distinct.
- [ ] Link to verified test/profiler/axe/Lighthouse evidence; list any remaining risks honestly.
- [ ] Confirm `.gitignore` excludes `node_modules/`, `dist/`, `.env`/secrets and generated artifacts not intended for submission.
- [ ] Verify a clean install (`npm ci`), tests, lint, production build and preview from inside `Homework_2/app`.
- [ ] Mark checklist items complete **only after checking them**; commit and push to **Lab 3**, not Lab 2.

**Acceptance:** A reviewer can clone Lab 3, run HW2 independently, reproduce the major behavior and inspect reuse/test/accessibility evidence.  
**Suggested commit:** `docs(hw2): finalize README reuse audit and submission`

## 5. WCAG 2.2 A/AA verification matrix

This is a **high-priority subset**, not an exhaustive WCAG conformance claim. Record actual Pass/Fail/Not verified results in `accessibility_audit.md`.

| Success criterion | Level | How to verify in HW2 |
|---|---|---|
| 1.1.1 Non-text Content | A | Buttons have meaningful text/accessible note labels; decorative shapes are not the only identification. |
| 1.3.1 Info and Relationships | A | Semantic buttons, headings, labels, groups and recording-status relationships. |
| 1.4.1 Use of Color | A | Pressed notes, record/replay state and errors have text/shape cues, not color alone. |
| 1.4.2 Audio Control | A | No unexpected autoplay; audible audio can be stopped/muted appropriately. |
| 1.4.3 Contrast (Minimum) | AA | Normal text ≥ 4.5:1; large text ≥ 3:1. |
| 1.4.4 Resize Text | AA | Text at 200% remains readable/operable. |
| 1.4.10 Reflow | AA | 320px-equivalent reflow; instrument-only scrolling justified if necessary. |
| 1.4.11 Non-text Contrast | AA | Important key borders/focus/state indicator contrast ≥ 3:1. |
| 1.4.12 Text Spacing | AA | No clipping or lost content with adjusted line/paragraph/letter spacing. |
| 2.1.1 Keyboard | A | All 88 keys and Record/Replay/Stop/speed controls keyboard operable. |
| 2.1.2 No Keyboard Trap | A | Arrow/Tab navigation can always exit controls. |
| 2.1.4 Character Key Shortcuts | A | If letter shortcuts exist, only active when relevant control focused, or configurable/off/remappable. |
| 2.4.3 Focus Order | A | Focus navigation matches meaningful visual/logical order. |
| 2.4.7 Focus Visible | AA | Focus is clearly visible on keys and controls. |
| 2.4.11 Focus Not Obscured (Minimum) | AA | Focused key remains visible under scrolling or overlays. |
| 2.5.3 Label in Name | A | Visible note text appears in accessible control name. |
| 2.5.7 Dragging Movements | AA | No essential drag-only operation; a single pointer can play notes. |
| 2.5.8 Target Size (Minimum) | AA | Targets are ≥24×24 CSS px or qualify for an allowed exception. |
| 3.3.2 Labels or Instructions | A | Recording/replay controls and speed have understandable instructions. |
| 4.1.2 Name, Role, Value | A | Piano buttons, toggles (if genuine), combobox/select, transport state are accurately exposed. |
| 4.1.3 Status Messages | AA | Brief replay/record status announces without moving focus; no rapid announcement flood. |

## 6. Testing scenarios and evidence to retain

| ID | Scenario | Expected result |
|---|---|---|
| P-01 | Generate the complete keyboard | Exactly 88 ordered MIDI notes, 52 white, 36 black. |
| P-02 | Check A4 and C4 | A4 = 440 Hz; C4 ≈ 261.626 Hz. |
| P-03 | Press/release one piano key | Correct pitch; short ADSR envelope; visual release not stuck. |
| P-04 | Press 8 different notes simultaneously | 8 tracked active voices, no steals. |
| P-05 | Press 9th distinct note | Oldest tracked note is stolen; new note sounds. |
| P-06 | Press same note repeatedly | Predictable retrigger; no stale callback deleting newer voice. |
| P-07 | Record simple melody and chord | Accurate note order, durations and overlapping notes. |
| P-08 | Replay speeds 0.5x/1x/2x | Correct scaled timing/durations, unchanged pitch. |
| P-09 | Stop during replay wait | No subsequent note begins; timers/promises canceled. |
| P-10 | Unmount during replay | No further sound or React state updates after unmount. |
| P-11 | Mouse, touch and keyboard | All notes start/release; no double-trigger or keyboard trap. |
| P-12 | React DevTools Profiler: single note | Unrelated memoized keys do not re-render due to that pressed-state update. |
| P-13 | At 320px and 400% zoom | All controls remain reachable; only necessary instrument region scrolls horizontally. |
| P-14 | Screen reader + keyboard | All labels, focus positions and status changes understandable. |
| P-15 | Axe + Lighthouse production audit | Real outcomes recorded; issues fixed or documented. |

## 7. Commit and progress protocol

1. Implement **one T-task** at a time; do not “one-shot” the whole homework.
2. Run task-specific tests plus `npm run build` and `npm run lint` as appropriate.
3. Update the exact corresponding `[ ]` checklist to `[x]` **only** after its acceptance check succeeds.
4. Commit functional changes and checklist updates together (or use a separate `docs(hw2): mark Txx as completed` commit when only documentation changes).
5. Push to the existing Lab 3 repository; check `git status` and `git remote -v` before the first HW2 push.
6. Keep a truthful audit trail. Failures, manual checks not yet run and known limitations stay visible rather than marked complete.

## 8. Authoritative references

- [W3C — WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [W3C — Understanding Reflow 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
- [W3C — Understanding Target Size (Minimum) 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [W3C — Understanding Character Key Shortcuts 2.1.4](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html)
- [React — memo](https://react.dev/reference/react/memo)
- [React — useCallback](https://react.dev/reference/react/useCallback)
- [MDN — Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MDN — AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- **User-provided source:** Lab 3 HW2 assignment slides and Lab 2 HW2 project ZIP; verify instructor rubric/slide code for any exact API or grading constraints.
