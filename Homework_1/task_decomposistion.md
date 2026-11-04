# Lab 3 — Homework 1: Task Decomposition

**Project:** Production Studio Drum Kit  
**Target:** WCAG 2.2 Level AA and a Lighthouse Accessibility score of 100  
**Timebox:** 1 week  
**Status:** Planning — implementation not started  
**Repository boundary:** New, independent Lab 3 repository; `Homework_1/` is one of three homework directories.

> **Assignment source:** HW1 slide, “Production Studio Drum Kit (WCAG 2.2 AA & 100 Lighthouse).” The specification requires physical keyboard codes, OS key-repeat protection, input-focus isolation, an accessible hit log, a visual decibel meter, and accessible drum-pad controls. The architecture and extra safeguards below are implementation recommendations, not additional claims about the instructor's requirements.

## 1. Objective and scope

Refactor the legacy Slide 26 drum kit (W/A/S/D/J/K/L) into a responsive, production-quality React application. Apply the keyboard, focus-management, and accessibility engineering learned in Lab 2 HW1, without continuing development inside the Lab 2 Git repository.

### Required functional outcomes

- [ ] Render seven distinct, labeled drum pads corresponding to **W, A, S, D, J, K, L**.
- [ ] Trigger the corresponding drum sound through the keyboard and by activating the on-screen pad.
- [ ] Map keyboard input with **`KeyboardEvent.code`**, not deprecated numeric `keyCode` or layout-dependent `key`.
- [ ] Ignore auto-repeat (`event.repeat`) so one held key does not generate repeated hits.
- [ ] Ignore drum shortcuts while typing in `input`, `textarea`, `select`, or editable content.
- [ ] Do not steal browser or assistive-technology shortcuts, including modifier-key combinations.
- [ ] Display a visible history of hits in an `<output aria-live="polite">` region.
- [ ] Display a visual signal-level/decibel meter alongside the drum pads.
- [ ] Provide accessible focus indication and a meaningful pressed/active state for pads.
- [ ] Meet applicable **WCAG 2.2 A and AA** success criteria; test, do not presume conformance.
- [ ] Aim for **100/100 Lighthouse Accessibility** and record actual results. Other Lighthouse category targets depend on the instructor's grading rubric.

### Explicit project boundaries

- **Do:** Create Lab 3 in its own Git repository, with `Homework_1/app/` as its independent React app.
- **Do:** Reuse appropriate Lab 2 *techniques* (keyboard event handling, focus management, ARIA, cleanup), or copy a genuinely reusable utility if justified.
- **Do not:** Commit Lab 3 into the Lab 2 repository or nest the Lab 3 Git repository inside Lab 2.
- **Do not:** Move `DataGrid.tsx` into this project just to claim reuse; it solves a different problem.

## 2. Proposed file organization

```text
Lab03_Repo/
├── Homework_1/
│   ├── task_decomposistion.md
│   ├── ai_rule.md
│   └── app/
│       ├── public/
│       │   └── sounds/                  # Licensed/local audio samples
│       ├── src/
│       │   ├── components/
│       │   │   ├── DrumKit.tsx
│       │   │   ├── DrumPad.tsx
│       │   │   ├── HitLog.tsx
│       │   │   └── SignalLevelMeter.tsx
│       │   ├── hooks/
│       │   │   └── useDrumKeyboard.ts
│       │   ├── config/
│       │   │   └── drumPads.ts
│       │   ├── audio/
│       │   │   └── audioEngine.ts
│       │   ├── App.tsx
│       │   └── App.css
│       └── package.json
├── Homework_2/                       # Added when HW2 starts
└── Homework_3/                       # Added when HW3 starts
```

> The filenames above are a suggested implementation structure, not an instructor-mandated layout. The first file deliberately uses the requested spelling, `task_decomposistion.md`.

## 3. Work breakdown structure

### Phase 0 — Repository, requirements, and baseline (Day 1)

**T01. Create and verify the independent project** — Priority: Critical

- [x] Create/clone the dedicated Lab 3 Git repository.
- [x] Create `Homework_1/app/` with React and TypeScript (Vite is recommended, not required).
- [x] Confirm Git's root and `remote.origin.url` point to **Lab 3**, not Lab 2.
- [x] Add these two planning documents before implementation.
- [x] Define commands for dev, build, lint, and test, as applicable.

**Acceptance:** The project runs locally, a production build succeeds, and the Git remote is the Lab 3 repository.

**T02. Formalize the drum contract** — Priority: Critical

- [x] Create one typed, single-source-of-truth configuration with seven `code` values: `KeyW`, `KeyA`, `KeyS`, `KeyD`, `KeyJ`, `KeyK`, `KeyL`.
- [x] Assign a unique drum name and audio sample to each code.
- [x] Document audio licensing or use appropriately licensed/local assets.
- [x] State the expected behavior when a sample cannot load or audio playback is blocked.

**Acceptance:** Every supported physical key maps to exactly one pad, and every pad exposes a visible and accessible label.

### Phase 1 — Keyboard and audio engine (Days 2–3)

**T03. Build `useDrumKeyboard`** — Priority: Critical

- [X] Use `useEffect` to register and remove keyboard event listeners.
- [X] Read `event.code`, never `keyCode`, to identify mapped keys.
- [X] Return early for `event.repeat`, `event.isComposing`, and `Ctrl`/`Alt`/`Meta` combinations.
- [X] Return early when the event target is an `INPUT`, `TEXTAREA`, `SELECT`, or an editable element (including an editable ancestor).
- [X] Satisfy **WCAG 2.1.4 Character Key Shortcuts**: make shortcuts active only while the drum-kit component is appropriately focused, **or** provide a usable shortcut on/off mechanism. Input isolation alone is insufficient.
- [X] Do not intercept keyboard events outside the allowed shortcut scope.
- [X] Call `preventDefault()` only for accepted mapped shortcuts when required; do not suppress `Tab`, `Enter`, `Space`, or screen-reader navigation.
- [X] Coordinate `keydown`/`keyup` and blur/visibility changes so the active visual state cannot stick.
- [X] Keep effect dependencies correct and avoid stale closures or duplicate listeners.

**Acceptance:** Exactly one hit is produced for one eligible physical key press; repeat, text entry, disabled shortcut mode, and browser shortcuts produce zero accidental hits; listeners are cleaned up on unmount.

**T04. Implement accessible pad activation** — Priority: Critical

- [x] Use native `<button type="button">` controls.
- [x] Include the instrument name and printed key in the accessible name, e.g., “Kick drum, W”.
- [x] Preserve native `Tab`, `Enter`, and `Space` behavior.
- [x] Ensure pointer activation and physical keyboard activation share the same sound/logging pipeline and do not double-fire.
- [x] Represent an active visual state using more than a color change.
- [x] Review the slide's `aria-pressed={isActive}` requirement carefully: WAI-ARIA defines `aria-pressed` for a **toggle** button, whereas a drum hit is normally momentary. Document the instructor-facing decision, ensure any reported state is truthful, and test with assistive technology. Do not treat `aria-pressed` as an automatic accessibility fix.
**Lab 2 HW1 Reuse Evidence**

- [x] Adapted keyboard focus scoping principles from DataGrid.tsx.
- [x] Reused the aria-describedby instruction pattern.
- [x] Adapted focus-visible styling for drum controls.
- [x] Reused the forced-colors accessibility approach.
- [x] Preserved native button keyboard interactions.
**Acceptance:** All seven pads work without a mouse, have predictable focus order, and expose correct button names and states to assistive technology.

**T05. Implement sound playback** — Priority: High

- [x] Load the seven audio samples without unnecessary network requests or blocking initial interaction.
- [x] Start/resume the audio context only following a user gesture when required by browser policy.
- [x] Allow rapid *distinct* key hits without unwanted sound cut-offs.
- [x] Add safe default output gain; prevent excessively loud/clipped output.
- [x] Handle missing/invalid samples gracefully and expose a readable error message.
- [x] Stop/release resources and event handlers during cleanup.

**Acceptance:** Each of the seven controls plays its intended sound, errors do not crash the page, and basic repeated interaction remains responsive.

### Phase 2 — Feedback, semantics, visual UI (Days 4–5)

**T06. Create the visible hit log** — Priority: Critical

- [x] Render a labeled hit history in an `<output aria-live="polite">` region as requested.
- [x] Record meaningful text such as pad name and time/order, not only decorative icons.
- [x] Bound the stored history (e.g., last 10–20 entries) to avoid unbounded growth.
- [x] Avoid overwhelming screen-reader users during fast sequences: provide concise status updates and assess an announcement-throttling strategy while keeping the visible history complete.
- [x] Do not move keyboard focus when a new hit is logged.
**Lab 2 HW1 Reuse Evidence**

- [x] Adapted the accessible status pattern from DataGrid.tsx.
- [x] Reused role="status" and aria-atomic="true".
- [x] Implemented polite live announcements.
- [x] Preserved keyboard focus during dynamic updates.
- [x] Added announcement throttling for rapid drum hits.

**Acceptance:** New hits are visible; screen-reader announcements are meaningful, polite, and do not interrupt focus or flood speech output.

**T07. Create the decibel/signal-level display** — Priority: High

- [x] Render a visible level meter near the drum pads.
- [x] Prefer a real output-signal measurement using `AnalyserNode`/RMS, displayed as **dBFS** (digital full-scale decibels), not as physical sound-pressure level in dB SPL.
- [x] Display an accessible numeric/text equivalent of the meaningful meter value; do not rely only on color or animation.
- [x] Use semantic markup such as `<meter>` when its range and meaning are well defined.
- [x] Limit visual update frequency and respect `prefers-reduced-motion` for nonessential animations.
- [x] Do not announce every animation frame through a live region.

**Acceptance:** The meter reacts to audio activity, has meaningful labels and bounds, and does not produce excessive assistive-technology announcements. If values are illustrative rather than measured, label them honestly.

**T08. Design responsive, perceivable UI** — Priority: High

- [x] Provide a descriptive page title, one `<h1>`, logical section headings, and instructions for keyboard and mouse/touch operation.
- [x] Maintain text contrast **at least 4.5:1** for normal text and **3:1** for large text.
- [x] Maintain **3:1** non-text contrast for essential pad boundaries, state markers, and meaningful meter graphics.
- [x] Use clear `:focus-visible` styling; focus must not be fully obscured by author content.
- [x] Target at least **24×24 CSS px** for pointer targets (prefer 44×44 px as a design goal).
- [x] Support 320 CSS px equivalent viewport width, 200% text resize, and 400% zoom/reflow without loss of essential functionality.
- [x] Ensure feedback does not depend exclusively on color, shape, sound, or animation.

**Acceptance:** All controls and feedback remain usable with keyboard-only navigation, zoom, and small screens.

### Phase 3 — Testing, audit, and delivery (Days 6–7)

**T09. Add targeted behavior tests** — Priority: Critical

- [x] Test all seven `code` mappings.
- [x] Test one physical key held down with repeated `keydown` events.
- [x] Test behavior when `input`, `textarea`, `select`, and `contenteditable` contain focus.
- [x] Test `Ctrl`/`Alt`/`Meta` combinations and IME composition.
- [x] Test shortcut scope/on-off behavior under WCAG 2.1.4.
- [x] Test pointer, `Tab`, `Enter`, and `Space` activation.
- [x] Test release on `keyup`, focus loss, visibility change, and unmount.
- [x] Test missing audio file, blocked playback, and rapid distinct hits.
- [x] Test log history limit and meter labels.

**Acceptance:** All scripted tests pass; any remaining limitation is explicitly documented.

**T10. Run accessibility verification** — Priority: Critical

- [x] Run axe or equivalent automated accessibility checks and resolve actionable findings.
- [x] Run Lighthouse against the **production build** and capture category scores, environment, and date.
- [x] Aim for **Lighthouse Accessibility 100/100**; do not infer WCAG conformance from a score alone.
- [x] Manually test keyboard-only use, focus order, focus visibility, keyboard exit, shortcut scope, and live announcements.
- [x] Test with at least one screen reader/browser pairing if available (e.g., NVDA + Chrome, VoiceOver + Safari).
- [x] Verify text/non-text contrast, text resizing, zoom/reflow, reduced motion, and accessible target sizes.
- [x] Review requirements against the applicable A/AA criteria, not just the subset listed below.

**Acceptance:** No known applicable WCAG 2.2 A/AA failures remain; Lighthouse results and manual test notes are included in submission evidence. Unverified items must be labeled “Not verified,” not “Pass.”

**T11. Document and submit** — Priority: High


- [ ] Include design decisions for shortcut handling and `aria-pressed` semantics.
- [ ] Add evidence/screenshots for desktop, mobile, keyboard focus, and audit results as appropriate.
- [ ] Commit Lab 3 work to the Lab 3 repository only.
- [ ] Confirm `Homework_1/` is independently runnable and does not depend on files from the Lab 2 checkout.

**Acceptance:** A reviewer can clone the Lab 3 repository, run HW1, verify the controls, and inspect the accessibility evidence.

## 4. WCAG 2.2 A/AA verification matrix

This is the **high-priority subset** for this app, not an exhaustive list of all WCAG requirements.

| Success criterion | Level | What to verify in this project |
|---|---|---|
| 1.1.1 Non-text Content | A | Accessible names/text alternatives for non-text information. |
| 1.3.1 Info and Relationships | A | Semantic headings, buttons, regions, labels, and meter semantics. |
| 1.4.1 Use of Color | A | Pressed state and level indication are not color-only. |
| 1.4.3 Contrast (Minimum) | AA | Normal text >= 4.5:1; large text >= 3:1. |
| 1.4.4 Resize Text | AA | 200% text resizing retains content/function. |
| 1.4.10 Reflow | AA | No two-dimensional scrolling for ordinary page content at the prescribed 320 CSS px equivalent width. |
| 1.4.11 Non-text Contrast | AA | Essential component and graphical cues >= 3:1. |
| 1.4.12 Text Spacing | AA | User text-spacing overrides do not lose information/function. |
| 2.1.1 Keyboard | A | Every pad/control is keyboard-operable. |
| 2.1.2 No Keyboard Trap | A | Users can leave all controls normally with keyboard. |
| 2.1.4 Character Key Shortcuts | A | Letter shortcuts can be turned off/remapped or work only while the relevant component is focused. |
| 2.4.3 Focus Order | A | Navigation order preserves meaning and usability. |
| 2.4.7 Focus Visible | AA | Visible focus indication for keyboard users. |
| 2.4.11 Focus Not Obscured (Minimum) | AA | Focused controls are not entirely hidden by authored content. |
| 2.5.2 Pointer Cancellation | A | Pointer interactions avoid accidental irreversible activation patterns. |
| 2.5.3 Label in Name | A | Accessible names contain visible labels when text is shown. |
| 2.5.8 Target Size (Minimum) | AA | Targets >= 24×24 CSS px, or qualify for a specified exception. |
| 4.1.2 Name, Role, Value | A | Native button semantics and truthful state/value. |
| 4.1.3 Status Messages | AA | Meaningful asynchronous status messages are announced without moving focus. |

## 5. Manual acceptance test cases

| ID | Steps | Expected result |
|---|---|---|
| AT-01 | Focus/enable drum shortcuts and press W/A/S/D/J/K/L once each. | Seven corresponding hits and seven visible log records. |
| AT-02 | Hold a mapped letter so the OS generates repeated keydowns. | One hit per deliberate press; no repeat flood. |
| AT-03 | Type mapped letters in a text input and textarea. | Text is entered normally; no drum sound or hit. |
| AT-04 | Use a select and editable content, then type mapped letters. | No unintended drum activation. |
| AT-05 | Disable shortcut mode or move focus outside the relevant scope. | Unmodified character shortcuts do not fire. |
| AT-06 | Press Ctrl+W, Alt+W, Meta+W where supported. | App does not hijack modifier shortcuts. |
| AT-07 | Navigate with Tab and activate every pad using Enter and Space. | Controls work and focus remains visible/predictable. |
| AT-08 | Activate a pad by pointer/touch. | Exactly one user-requested hit; no accidental double-fire. |
| AT-09 | Press a key, then switch tabs or blur the window. | No permanently stuck pressed visual state. |
| AT-10 | Rapidly trigger several different pads. | No crash; visible history stays bounded; announcements remain usable. |
| AT-11 | Check meter in silence and after hits. | Labeled, plausible levels, numeric/text equivalent, no fake SPL claim. |
| AT-12 | Test at 320 CSS px and high zoom/text spacing. | All essential content and actions remain available. |
| AT-13 | Run Lighthouse/axe, then perform manual screen-reader tests. | Issues are fixed or transparently recorded; evidence is saved. |

## 6. Definition of done

- [ ] All slide-specified features work: physical-code shortcuts, repeat prevention, input isolation, accessible buttons, hit log, and visual meter.
- [ ] All relevant WCAG 2.2 Level A and AA requirements have been checked, including **2.1.4**.
- [ ] The `aria-pressed` design decision is justified against WAI-ARIA toggle-button semantics.
- [ ] Audio/interaction failures are handled gracefully.
- [ ] Targeted tests, production build, accessibility audit, and manual checks are complete.
- [ ] Lighthouse Accessibility score is recorded; 100/100 is a target, never a fabricated claim.
- [ ] HW1 is self-contained under `Homework_1/` in the **separate Lab 3 repository**.

## 7. Authoritative references

- W3C — WCAG 2.2 Recommendation: https://www.w3.org/TR/WCAG22/
- W3C — How to Meet WCAG 2.2: https://www.w3.org/WAI/WCAG22/quickref/
- W3C — WAI-ARIA Button Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/button/
- W3C — Status Messages (ARIA22): https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA22
- Chrome Developers — Lighthouse Accessibility Scoring: https://developer.chrome.com/docs/lighthouse/accessibility/scoring/
