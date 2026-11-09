# Lab 3 – Homework 2

## 88-Key Polyphonic Piano & Concurrent FIFO Sequencer

### 1. Project Overview

This project is an interactive 88-key polyphonic piano application developed using React, TypeScript, Vite, and the Web Audio API.

The application combines concepts from:

- **Lab 2 – Slide 21:** React.memo and shallow comparison.
- **Lab 2 – Homework 2:** FIFO AudioTaskQueue and asynchronous task management.
- **Legacy Slide 27:** 88-key piano implementation.

The goal is to implement an accessible, performant piano with polyphonic audio synthesis, note recording, and asynchronous melody replay.

The project targets **WCAG 2.2 Level AA** accessibility.

### 2. Technologies

| Technology | Purpose |
|---|---|
| React | Component-based user interface |
| TypeScript | Type safety |
| Vite | Development and production build |
| Web Audio API | Piano audio synthesis |
| React.memo | Rendering optimization |
| AbortController | Replay cancellation |
| Vitest | Automated unit testing |
| React DevTools | Component rendering analysis |
| HTML5 / CSS3 | Semantic and responsive interface |

### 3. Main Features

#### 3.1. Mathematical 88-Key Piano

The application generates 88 piano keys dynamically using MIDI values from 21 to 108.

- 52 white keys.
- 36 black keys.
- First note: A0 (MIDI 21).
- Last note: C8 (MIDI 108).
- A4 = 440 Hz.

Frequency calculation:

`frequency = 440 × 2^((midi - 69) / 12)`

Individual piano keys are generated mathematically rather than hardcoded.

#### 3.2. Eight-Voice Polyphonic Synthesizer

The synthesizer uses the Web Audio API.

Features:

- Oscillator-based sound generation.
- Gain envelopes for smooth note transitions.
- Maximum of eight simultaneous audio voices.
- Automatic voice cleanup.
- FIFO voice stealing.

When the ninth voice is created, the oldest active voice is removed.

An insertion-ordered JavaScript Map maintains FIFO ordering.

#### 3.3. React.memo Rendering Optimization

Each piano key uses `React.memo`.

The implementation uses stable callback references through `useCallback` and preserves references to unchanged key data.

Expected behavior:

- Pressing one key updates its active state.
- Releasing the key restores its inactive state.
- Unchanged piano keys avoid unnecessary re-renders.

Rendering behavior is verified using the React Developer Tools Profiler.

#### 3.4. Accessible Piano Controls

Users can interact with piano keys using:

- Mouse.
- Touchscreen.
- Tab navigation.
- Enter.
- Space.

Holding an input activates a note, and releasing it stops the note.

The application also handles focus loss and visibility changes to prevent stuck notes.

#### 3.5. MIDI Note Recording

The recorder captures:

- MIDI note number.
- Frequency in Hz.
- Note duration in milliseconds.
- Time difference between consecutive note starts.

Recording controls:

- **Start Recording:** Begin capturing note events.
- **Stop Recording:** Finish recording and save notes in application memory.
- **Clear:** Remove the recorded sequence.

Overlapping notes are supported.

#### 3.6. Concurrent FIFO Melody Replay

The replay system uses asynchronous scheduling techniques adapted from Lab 2 HW2.

Supported playback speeds:

- 0.5× – Slow.
- 1× – Normal.
- 2× – Fast.

The scheduler preserves note ordering and allows overlapping notes.

`AbortController` is used to cancel pending replay operations.

Pressing **Stop Replay** cancels pending tasks and releases active replay voices.

### 4. Lab 2 Code Reuse and Migration

#### 4.1. Source Components

The implementation references the following Lab 2 HW2 modules:

- `audio-task.ts`
- `audio-queue-controller.ts`
- `audio-playback-engine.ts`
- Related automated tests.

#### 4.2. Reused Architectural Patterns

| Lab 2 HW2 Concept | Lab 3 HW2 Application |
|---|---|
| FIFO task ordering | Melody replay scheduling |
| AbortController | Replay cancellation |
| Asynchronous task lifecycle | Note scheduling |
| Task cancellation | Stop Replay |
| Resource cleanup | Audio voice disposal |
| FIFO data structure | Voice stealing |
| React.memo from Slide 21 | PianoKey render isolation |

#### 4.3. Migration Strategy

The original Lab 2 AudioTaskQueue focused on asynchronous audio processing.

Lab 3 adapts its queue management and cancellation principles to a piano sequencer.

Audio downloading and decoding logic are not required for the oscillator-based synthesizer.

FIFO replay scheduling and FIFO voice stealing are implemented as separate mechanisms.

The Lab 3 project remains independent of the Lab 2 repository.

### 5. Project Structure

```text
Homework_2/
├── app/
│   ├── public/
│   ├── src/
│   │   ├── audio/
│   │   │   ├── PolyphonicSynth.ts
│   │   │   └── PolyphonicSynth.test.ts
│   │   ├── components/
│   │   │   ├── Piano.tsx
│   │   │   └── PianoKey.tsx
│   │   ├── music/
│   │   │   ├── pianoKeys.ts
│   │   │   └── pianoKeys.test.ts
│   │   ├── sequencer/
│   │   │   ├── NoteRecorder.ts
│   │   │   ├── NoteRecorder.test.ts
│   │   │   ├── ReplayScheduler.ts
│   │   │   └── ReplayScheduler.test.ts
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── evidence/
├── ai_rule.md
├── task_decomposition.md
└── README.md
```

### 6. Installation and Setup

**Requirements:**

- Node.js compatible with the installed Vite version.
- npm.
- A modern browser supporting the Web Audio API.

Clone the Lab 3 repository and navigate to Homework 2:

```bash
cd Homework_2/app
npm ci
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed by Vite, usually:

`http://localhost:5173/`

### 7. Build and Testing

Run automated tests:

```bash
npm run test
```

Run TypeScript checks and create a production build:

```bash
npm run build
```

Run the linter:

```bash
npm run lint
```

Preview the production build:

```bash
npm run preview
```

#### Test Coverage

The automated tests cover:

**Piano Model**

- Exactly 88 keys.
- Correct white and black key counts.
- MIDI range validation.
- Frequency calculations.
- Unique MIDI values.

**Polyphonic Synthesizer**

- Eight simultaneous voices.
- FIFO voice stealing.
- Correct release behavior.
- Audio resource cleanup.

**Note Recorder**

- Accurate MIDI event recording.
- Duration and delta calculations.
- Overlapping notes.
- Duplicate event prevention.
- Stop and Clear behavior.

**Replay Scheduler**

- FIFO note ordering.
- Overlapping note playback.
- Cancellation through AbortController.
- Replay failure handling.
- Recovery after cancellation or failure.

Automated tests use mocks where necessary to verify deterministic audio behavior.

Actual audio playback must also be tested manually in a browser.

### 8. WCAG 2.2 AA Accessibility

The application incorporates accessibility features based on WCAG 2.2 Level AA.

#### Keyboard Accessibility

- Piano keys are native HTML buttons.
- Tab navigation follows MIDI order.
- Enter and Space activate focused keys.
- Keyboard focus indicators are visible.
- Recording and replay controls support keyboard interaction.

#### Semantic HTML and ARIA

- Semantic headings and sections.
- Accessible labels for piano keys.
- Accessible playback speed selection.
- Status messages for recording and replay.
- Text-based error feedback.

#### Visual Accessibility

- Text contrast targets WCAG AA requirements.
- Focus indicators are visually distinguishable.
- Responsive layout for smaller screens.
- High Contrast Mode support.
- Reduced-motion support.
- Active key states use additional visual indicators.

#### Manual Accessibility Verification

Verification should include:

- Keyboard-only navigation.
- Screen reader testing.
- Text and non-text contrast checks.
- 200% text resizing.
- 400% browser zoom.
- Responsive layout and reflow.
- Focus visibility.
- Target size inspection.

Automated accessibility scores alone do not establish full WCAG 2.2 AA conformance.

### 9. React DevTools Profiler Verification

React DevTools Profiler is used to inspect rendering behavior.

Verification procedure:

1. Open the application in Chrome.
2. Open React Developer Tools.
3. Select the Profiler tab.
4. Start profiling.
5. Press and release one piano key.
6. Stop profiling.
7. Inspect the rendered components.

**Expected result:**

The active `PianoKey` updates without unnecessarily re-rendering the other 87 keys.

Actual verification results should be documented with screenshots.

### 10. Verification Evidence

Store screenshots from completed tests in the `evidence/` directory.

Recommended files:

- `desktop.png` – Desktop interface.
- `mobile.png` – Mobile layout.
- `react-profiler.png` – React.memo verification.
- `test-results.png` – Automated test results.
- `wcag-audit.png` – Accessibility verification.

Only include evidence obtained from actual testing.

### 11. Known Limitations

- Piano sound is generated using oscillators rather than sampled acoustic piano recordings.
- A maximum of eight voices can play simultaneously.
- FIFO voice stealing may interrupt an older note.
- Recorded sequences remain in application memory and are not automatically saved to persistent storage.
- Audio output depends on the browser and operating system.
- Manual accessibility testing remains necessary.

### 12. Conclusion

Lab 3 Homework 2 demonstrates the integration of:

- Mathematically generated 88-key piano interfaces.
- Eight-voice polyphonic audio synthesis.
- FIFO voice management.
- React.memo rendering optimization.
- MIDI recording.
- Abortable asynchronous melody replay.
- Accessible React interface design.

The project builds on concepts introduced in Lab 2 while maintaining an independent implementation within the Lab 3 repository.

---

**Course:** Web Application Development – Practical Lab 3  
**Assignment:** Homework 2  
**Accessibility Target:** WCAG 2.2 Level AA
