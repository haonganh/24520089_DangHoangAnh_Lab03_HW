# AI Engineering Rules — Lab 3 Homework 1

**Project:** Production Studio Drum Kit  
**Conformance target:** WCAG 2.2 Level AA (including every applicable Level A criterion)  
**Quality target:** Lighthouse Accessibility 100/100, verified against a production build  
**Applies to:** Any AI-generated plan, component, hook, test, style, refactor, or documentation in `Homework_1/`.

## 1. Non-negotiable operating principles

1. **Follow the provided assignment first.** Build the seven-pad W/A/S/D/J/K/L Drum Kit with physical key-code handling, anti-repeat protection, typing isolation, an ARIA-aware hit log, and a visual decibel/signal-level meter.
2. **Follow web standards as well as the slide.** If a requested implementation detail appears to conflict with semantic HTML or WAI-ARIA guidance, flag the conflict and choose/document a defensible solution; do not silently claim compliance.
3. **Keep repositories separate.** Lab 3 must live in its own repository. Never commit Lab 3 into Lab 2, nest repositories, or copy `.git/` from Lab 2.
4. **Reuse engineering patterns, not irrelevant UI.** Carry over useful keyboard/focus/a11y approaches from Lab 2 HW1; do not mechanically transplant its DataGrid into a drum application.
5. **No unsupported claims.** Do not state “WCAG compliant,” “Lighthouse 100,” “screen-reader tested,” or “all tests pass” without actual evidence.
6. **Accessible by default.** Favor semantic native elements, predictable keyboard interactions, visible focus, accurate accessible names, and usable text equivalents.
7. **No accessibility regressions.** A visual or performance optimization may not remove keyboard access, labels, status feedback, or focus visibility.

## 2. Required behavior contract

### 2.1 Physical key mapping

Use these exact `KeyboardEvent.code` values as the input contract:

| Physical code | Printed key | Requirement |
|---|---|---|
| `KeyW` | W | Triggers exactly the configured W pad. |
| `KeyA` | A | Triggers exactly the configured A pad. |
| `KeyS` | S | Triggers exactly the configured S pad. |
| `KeyD` | D | Triggers exactly the configured D pad. |
| `KeyJ` | J | Triggers exactly the configured J pad. |
| `KeyK` | K | Triggers exactly the configured K pad. |
| `KeyL` | L | Triggers exactly the configured L pad. |

- **MUST** map the physical position with `event.code`. Do **not** use deprecated `event.keyCode`/`which` or depend on `event.key` for physical routing.
- **MUST** make the same underlying activation action available through native button activation (pointer, Enter, Space).
- **MUST** keep the pad map centralized; do not duplicate divergent mappings in the hook, UI, and audio engine.
- **MUST** label keyboard shortcuts as the printed **W/A/S/D/J/K/L** controls requested by the assignment; explain that physical-key behavior can differ across keyboard layouts.

### 2.2 Keyboard event safety

- **MUST** reject `event.repeat` to prevent held-key floods.
- **MUST** reject `event.isComposing` during IME composition.
- **MUST** leave `Ctrl`, `Alt`, and `Meta` key combinations alone. Consider `Shift` carefully: a shifted key must not unexpectedly interfere with typing or browser features.
- **MUST** ignore events from `INPUT`, `TEXTAREA`, `SELECT`, and elements within `contenteditable` contexts; use `closest()` or an equivalent robust ancestor check.
- **MUST** implement a WCAG 2.1.4-safe shortcut strategy: either **(a)** shortcuts work only when the associated drum control/region is in focus, **(b)** a discoverable and accessible control turns shortcuts off, or **(c)** shortcuts can be remapped to include a non-printable modifier. Input-focus exclusion **alone is not enough**.
- **MUST NOT** hijack unmodified character shortcuts across unrelated page content.
- **MUST** call `preventDefault()` only after confirming the event is an eligible mapped shortcut; do not block Tab, Enter, Space, browser commands, or assistive-technology navigation.
- **MUST** attach and detach handlers correctly inside React effects; no listener leaks, duplicate firing, or stale state.
- **MUST** avoid a permanently active pad: release transient press state on `keyup`, window blur, loss of visibility, component unmount, and corresponding pointer release/cancel where relevant.
- **SHOULD** keep audio-event processing outside expensive state update loops to minimize latency.

### 2.3 Native controls and ARIA

- **MUST** use `<button type="button">` for each actionable pad, not a clickable `div` or `span`.
- **MUST** give every pad an accessible name containing the visible label and instrument identity. Never use an icon or single letter as the only accessible clue when the instrument purpose is relevant.
- **MUST** preserve native `Enter` and `Space` activation, tab order, and focus behavior.
- **MUST** provide a visible focus indicator for keyboard users. Focus must not be completely obscured by overlays/sticky content (WCAG 2.4.7, 2.4.11).
- **MUST** communicate active feedback in a non-color-only way (e.g., an outline/scale/text plus color).
- **MUST** examine the assignment's `<button aria-pressed={isActive}>` example before copying it. The official WAI-ARIA button pattern reserves `aria-pressed` for **toggle buttons**, while drum strikes are usually **momentary commands**. If implementing `aria-pressed` to follow the slide, it must reflect genuine state and be verified with assistive technology; document the semantic trade-off. Do not claim `aria-pressed` is inherently required by WCAG 2.2 or automatically correct for momentary hits.
- **MUST NOT** add redundant or misleading ARIA when native HTML already supplies the needed semantics.
- **MUST** ensure each visible textual control label is included in its accessible name (WCAG 2.5.3).

### 2.4 Audio and interaction safety

- **MUST** initiate audible playback only after a user action, respecting browser autoplay restrictions.
- **MUST** prevent sound overlap from unintentional key auto-repeat while still allowing deliberate rapid sequences.
- **MUST** use safe default volume/gain, avoid clipping where feasible, and recover gracefully from audio loading/playback errors.
- **MUST** provide non-audio confirmation for every hit; never make sound the sole feedback channel.
- **MUST** preserve pointer cancellation behavior: avoid unnecessarily triggering irreversible actions on `pointerdown`; if lower-latency start-on-down is used, reason about release/cancel behavior and document it.
- **SHOULD** provide volume/mute controls if the implementation benefits from them, with clear labels and accessible states.
- **MUST NOT** read microphone input, record audio, or request unnecessary permissions for a playback-only drum kit.

### 2.5 Hit log and live announcements

- **MUST** implement the slide's visible hit history with `<output aria-live="polite">` or an equivalently documented accessible arrangement that meets the instructor's requirement.
- **MUST** provide useful, concise textual entries (such as instrument name and hit sequence/time).
- **MUST** ensure log updates do not steal focus.
- **MUST** avoid a screen-reader announcement storm under fast drumming. Throttle/coalesce announcements if necessary while preserving the full visible recent history.
- **MUST** cap stored history to a documented recent-entry limit; avoid endless DOM growth.
- **MUST** ensure screen-reader feedback does not rely solely on an animated level meter.
- **SHOULD** test the actual live-region output using a screen reader; `aria-live` markup alone does not prove user experience quality.

### 2.6 Signal level / decibel meter

- **MUST** render a visible, labeled signal-level indicator next to or near the pads.
- **MUST** convey its meaningful value with text or correct accessible meter semantics rather than color/height alone.
- **MUST** distinguish **dBFS** (digital audio signal level) from **dB SPL** (physical acoustic loudness). An app without calibrated microphone measurements cannot honestly claim to show real-world sound-pressure decibels.
- **SHOULD** compute a real digital signal level with Web Audio `AnalyserNode` and an appropriate RMS-to-dBFS conversion; handle silence and a defined bounded display range.
- **MUST** label a synthetic activity estimate as simulated/relative if genuine audio analysis is unavailable.
- **MUST** avoid continuous `aria-live` updates for the meter, which would overwhelm assistive technology.
- **MUST** clean up animation frames and audio resources when they are no longer needed.

## 3. Visual accessibility requirements

| Topic | Implementation rule | WCAG reference |
|---|---|---|
| Text contrast | Normal text >= **4.5:1**; large text >= **3:1**. | 1.4.3 (AA) |
| Essential non-text contrast | Critical boundaries, indicators, and graphics >= **3:1** against adjacent colors. | 1.4.11 (AA) |
| Color independence | Include text, shape, outline, or another cue in addition to color. | 1.4.1 (A) |
| Keyboard access | All controls must work with a keyboard; no keyboard trap. | 2.1.1, 2.1.2 (A) |
| Character shortcuts | Provide focused-only, off, or remap behavior. | 2.1.4 (A) |
| Focus | Visible indicator and no entirely obscured focus. | 2.4.7, 2.4.11 (AA) |
| Target size | >= **24×24 CSS px** unless an exception applies; aim for 44×44 in design. | 2.5.8 (AA) |
| Zoom and reflow | Support resize/reflow, including 200% text resize and 320 CSS px equivalent width. | 1.4.4, 1.4.10 (AA) |
| Text spacing | No clipped content or lost functions under WCAG text-spacing overrides. | 1.4.12 (AA) |
| Status messages | Expose important non-focus-changing updates to assistive technology. | 4.1.3 (AA) |
| Names and states | Correct accessible name, role, and truthful state/value. | 4.1.2 (A) |

Additional rules:

- **MUST** use semantic page structure (`<main>`, headings, explicit labels where applicable).
- **MUST NOT** create fast flashing effects. Keep visual hit feedback brief and respect `prefers-reduced-motion` for nonessential motion.
- **MUST NOT** disable zoom, remove focus outlines without replacements, or force a fixed-width layout that loses functionality on small screens.
- **MUST** maintain a usable UI in desktop, mobile, high-zoom, and keyboard-only contexts.
- **SHOULD** test with increased browser text spacing/line height to catch overflow.

## 4. React and TypeScript code rules

1. **Prefer TypeScript.** Define explicit types for the pad map, callbacks, and log entries; avoid `any` except when unavoidable and justified.
2. **Separate responsibilities.** The keyboard hook handles eligible events; the pad component renders a native control; a single activation function handles sound, state, and hit logging; the meter displays audio levels.
3. **Use stable lifecycle management.** Register listeners only when needed; always remove them in effect cleanup. Handle React Strict Mode without duplicate hits.
4. **Avoid fragile DOM operations.** Do not manipulate React-managed UI via `innerHTML`, global selectors, or arbitrary focus changes.
5. **Guard against stale callbacks.** Use correct effect dependencies and stable callbacks/refs where needed; do not silence lint rules to conceal problems.
6. **Avoid unnecessary dependencies.** Favor browser APIs and React primitives. Add libraries only when there is a concrete benefit.
7. **Keep state truthful.** Do not show a permanently pressed pad after key release, blur, or cancellation; do not display fabricated signal levels as measured data.
8. **Handle failures.** Catch rejected audio playback promises and missing assets. Show a nonintrusive readable error/status.
9. **No secrets or absolute local paths.** Do not commit tokens, machine-specific paths, `node_modules/`, build outputs, or private files.
10. **Keep each homework self-contained.** Homework 1 must not import source files using relative paths into the Lab 2 checkout or another homework.

## 5. AI change protocol

For every significant AI-assisted implementation step:

1. **Identify the specific requirement** and its task ID from `task_decomposistion.md`.
2. **Describe the intended minimal change** and list the affected files before changing implementation.
3. **Explain accessibility impact**, especially keyboard scope, focus, semantics, or live-region behavior.
4. **Implement only the requested feature** without unrelated rewrites or unapproved features.
5. **List tests to run** (automated and manual) and actually run available commands when tools permit.
6. **Report observed results, not assumptions.** Clearly distinguish “implemented,” “tested,” “not tested,” and “known issue.”
7. **Update the task checklist** when a task has genuinely passed its acceptance criteria.
8. **Preserve developer control:** Do not delete files, change Git remotes, push commits, or alter Lab 2 code unless explicitly requested.

## 6. Mandatory test gates before declaring HW1 complete

- [ ] **Build gate:** Production build completes without actionable errors.
- [ ] **Keyboard gate:** All W/A/S/D/J/K/L shortcuts use `event.code` and trigger one hit per intentional press.
- [ ] **Repeat gate:** `event.repeat` does not flood sounds/log entries.
- [ ] **Typing gate:** Inputs, textarea, select, and editable regions are isolated.
- [ ] **Character shortcut gate:** WCAG 2.1.4 is satisfied independently of typing isolation.
- [ ] **Modifier gate:** Browser/OS modifier shortcuts are not hijacked.
- [ ] **Focus gate:** Every control is tabbable (as appropriate), usable, visibly focused, and not trapped.
- [ ] **Semantics gate:** Accessible names, button roles, active state semantics, and live log are checked.
- [ ] **Audio gate:** All samples work, and missing samples fail gracefully.
- [ ] **Meter gate:** The measurement is meaningful and not mislabeled as acoustic dB SPL.
- [ ] **Responsive gate:** Narrow screens, zoom, text resize, and reduced motion have been checked.
- [ ] **Audit gate:** Automated accessibility scans and Lighthouse run on a production build, with scores captured.
- [ ] **Manual gate:** At least keyboard-only and representative screen-reader checks are completed or explicitly marked not verified.
- [ ] **Repository gate:** All delivered work resides inside the independent Lab 3 repository.

### How to report quality truthfully

- Say **“Lighthouse Accessibility: 100/100 (tested on [date, browser, build])”** only if the score was actually obtained.
- Say **“WCAG 2.2 AA testing completed”** only if the applicable criteria were reviewed with both automated and manual checks.
- If a test was not run, use **“Not verified”**. If a criterion failed, name the criterion and the issue.
- A perfect Lighthouse score does **not** certify WCAG conformance; automated checks cover only part of accessibility.

## 7. Prohibited shortcuts and anti-patterns

**Never:**

- Use `event.keyCode` or `which` for the physical drum key map.
- Use `event.repeat === true` as a valid trigger.
- Let global unmodified letter shortcuts fire with no WCAG 2.1.4 safeguard.
- Trigger drums while the user is typing in editable controls.
- Disable keyboard focus indicators or require a mouse to play.
- Replace native buttons with nonsemantic clickable containers without justification.
- Add `aria-pressed` blindly to a momentary button and claim it guarantees compliance.
- Use `aria-live="assertive"` for every drum hit, or spam announcements at audio frame rate.
- Claim acoustic decibel measurements from a purely digital playback meter.
- Ship a fake Lighthouse score or mark untested WCAG criteria “passed.”
- Reuse the Lab 2 Git repository or modify Lab 2 homework as a side effect.

## 8. Normative and implementation references

1. W3C WCAG 2.2 — https://www.w3.org/TR/WCAG22/
2. W3C WCAG 2.2 Quick Reference — https://www.w3.org/WAI/WCAG22/quickref/
3. W3C WAI-ARIA Button Pattern — https://www.w3.org/WAI/ARIA/apg/patterns/button/
4. W3C ARIA22 Status Messages — https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA22
5. Chrome Developers: Lighthouse Accessibility Scoring — https://developer.chrome.com/docs/lighthouse/accessibility/scoring/

> **Scope note:** These rules prioritize the app's known risks but do not replace a full review of all applicable WCAG 2.2 Level A and AA criteria. Treat the assignment slide and instructor's submission instructions as the definitive source for non-accessibility grading requirements.
