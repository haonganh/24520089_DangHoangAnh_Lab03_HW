# AI Failure Audit — Lab 3, Homework 1

**Project:** Production Studio Drum Kit (React, TypeScript, Vite)  
**Review date:** 2026-11-04  
**Audit source:** `24520089_DangHoangAnh_Lab03_Hw.zip` supplied for this review  
**Review scope:** `Homework_1/` only; source code, configuration, test cases, audio file integrity, accessibility patterns, and submission documentation  
**Purpose:** Identify defects and unverified assumptions introduced or overlooked during AI-assisted implementation; describe how to recognize, reproduce, fix, and regression-test them.

> **Important:** This report describes the uploaded ZIP snapshot, not necessarily a later local or GitHub revision. Findings marked **Confirmed** are supported by source inspection, project file inventory, or deterministic code behavior. Findings marked **Needs browser verification** require a real browser/screen reader or runtime test. A missing file in the ZIP does not prove it never existed elsewhere.

## 1. Review method and evidence

- Inspected the React components, keyboard hook, audio engine, CSS, Vite/Vitest configuration, tests, and homework documents.
- Verified the seven configured sound paths exist in `app/public/sounds/`.
- Examined all seven WAV headers and decoded them using Python's standard `wave` module: each is valid 16-bit, mono, 44,100 Hz PCM; durations range from approximately 0.115 to 1.234 seconds. This verifies file structure, **not** rights to use the samples or browser playback quality.
- Ran `tsc -p tsconfig.app.json --noEmit` using the available TypeScript 5.8.3 compiler: **passed (exit code 0)**. The project itself declares TypeScript 7.0.2; the two versions are not equivalent.
- Attempted to run the uploaded dependencies' Vitest and Oxlint under Linux. They could not start because the archive's native dependencies were installed for Windows, not Linux. This is an **audit-environment limitation**, **not** evidence that tests or lint fail on the student's Windows machine.
- Inspected the bundled Vitest results cache: it records three test files as previously passing. A saved cache is historical evidence, **not** a fresh test run.
- **Not verified here:** `npm run build` with the exact uploaded TypeScript/Vite native toolchain, fresh Vitest results, live browser audio, actual Lighthouse scores, axe scan, NVDA behavior, 400% zoom, or color-contrast results.

### Executive findings

| ID | Priority | Finding | Evidence state |
|---|---|---|---|
| F-01 | High | A labeled focusable `div` lacks an ARIA role that permits naming | Confirmed markup/ARIA mismatch |
| F-02 | High | Repeated same-pad announcements may not retrigger the live region | Confirmed state logic; browser effect to verify |
| F-03 | High | WCAG/Lighthouse audit evidence is referenced but absent from ZIP | Confirmed missing in ZIP |
| F-04 | High | Test checklist claims coverage not present in the actual tests | Confirmed coverage gap |
| F-05 | Medium | Audio credits/license manifest is missing | Confirmed documentation gap |
| F-06 | Medium | Duplicate keyboard test suites run the same six scenarios twice | Confirmed duplication |
| F-07 | Medium | Dead JSX expression remains after the DrumKit component | Confirmed code defect; not a TypeScript error |
| F-08 | Medium | Out-of-order playback failures can display a stale error | Confirmed race possibility; needs runtime reproduction |
| F-09 | Medium | Pad feedback is inconsistent across shortcut vs click/Enter/Space | Needs browser verification |
| F-10 | Medium | README and project-status documentation are inconsistent | Confirmed documentation mismatch |
| F-11 | Review | Live-log structure and `aria-pressed` differ from literal slide examples | Specification interpretation, not automatically a WCAG failure |

## 2. Detailed findings

### F-01 — Inappropriate accessible name on an untyped `div`

- **Priority / state:** **High — Confirmed source-level mismatch.**
- **Location:** `Homework_1/app/src/components/DrumKit.tsx:106–112`.
- **Observed code:** A focusable `<div tabIndex={0}>` has `aria-label="Drum kit keyboard area"` and `aria-describedby`, but no explicit `role`.
- **Why it matters:** An ordinary `div` normally exposes the generic role, which prohibits author-provided accessible names. The label may be ignored or reported by accessibility tools. Adding `tabIndex` alone does not define an appropriate semantic role.
- **How to recognize/reproduce:** Inspect the focused Drum Kit container in Chrome's **Accessibility** pane; run axe; verify its computed **Role** and **Name**. Check whether NVDA announces the keyboard region meaningfully.
- **Recommended fix:** Give this existing keyboard-shortcut scope a valid semantic role, e.g.:

  ```tsx
  <div
    ref={scopeRef}
    role="group"
    tabIndex={0}
    className="drum-kit"
    aria-label="Drum kit keyboard area"
    aria-describedby="drum-kit-instructions"
  >
  ```

  Keep its existing children and event logic unchanged. `role="group"` permits naming while preserving a clear keyboard-focus scope.
- **Regression check:** The accessibility tree exposes **group → Drum kit keyboard area**; Tab can enter and leave it; all seven shortcut keys, button names, and the `aria-describedby` instruction remain functional.
- **Relevant standard:** [ARIA in HTML](https://www.w3.org/TR/html-aria/), guidance on generic roles and prohibited naming.

### F-02 — Identical live-status text may not be announced twice

- **Priority / state:** **High — Confirmed React-state pattern; screen-reader outcome needs browser verification.**
- **Location:** `DrumKit.tsx:35–52` and `HitLog.tsx:21–28`.
- **Observed code:** The interval sets `announcement` to `${latest} drum triggered.` for each single hit. Two separate Kick hits can produce the identical string, so React may not update the `<output>` content the second time.
- **How to recognize/reproduce:** Focus the Drum Kit; press **W** once, wait more than 1.2 s, press **W** again, then listen to NVDA/Chrome and inspect whether the `<output>` text node changes after the second event. The visible history may show two entries even if only one live announcement occurs.
- **Recommended fix:** Include a monotonically increasing identifier, such as the latest hit sequence number, in the announcement. For example, in the existing announcement timer:

  ```tsx
  const latestHitId = hitIdRef.current;
  setAnnouncement(
    count === 1
      ? `Hit ${latestHitId}: ${latest} drum triggered.`
      : `${count} drum hits triggered. Latest: ${latest}. Hit ${latestHitId}.`
  );
  ```

  Maintain the 1.2-second announcement batching; do not make the whole log a continuously announcing live region.
- **Regression check:** Two isolated presses of the same pad create distinct DOM text and appropriate announcements; fast sequences still produce one concise summary per batch and do not move focus.
- **Relevant standard:** [WCAG 2.2, 4.1.3 Status Messages](https://www.w3.org/TR/WCAG22/#status-messages).

### F-03 — Accessibility verification has no supporting artifacts in this ZIP

- **Priority / state:** **High — Confirmed missing deliverables in provided ZIP.**
- **Location:** `Homework_1/task_decomposistion.md` (T10 marked complete), `Homework_1/app/README.md:109–122` (references `accessibility_audit.md`).
- **Observed:** No `accessibility_audit.md`, `evidence/`, Lighthouse screenshot/report, axe results, or recorded screen-reader test notes were included in `Homework_1/` in the provided archive. A claimed 100/100 score is **not verifiable** from these files.
- **How to recognize/reproduce:** Search the extracted homework for `accessibility_audit.md`, `lighthouse`, `axe`, or `evidence/`. Compare the README and T10 completion boxes against the actual files.
- **Recommended fix:** Create `Homework_1/accessibility_audit.md`; record date, browser/version, production-build URL, Desktop/Mobile scores, actual axe findings, keyboard and screen-reader results, contrast/reflow/zoom checks, and any unresolved limitations. Save original screenshots or exported reports in `Homework_1/evidence/` if the course expects evidence. Record **Not verified** where no test was actually performed.
- **Regression check:** A reviewer can open every evidence link and match each asserted `Pass`/score to a real result. Do not automatically change unverified items to `Pass`.

### F-04 — T09 is checked off, but several required behaviors have no test

- **Priority / state:** **High — Confirmed test-coverage gap.**
- **Location:** `task_decomposistion.md` (T09 checked items); `app/src/components/DrumKit.test.tsx`; `app/src/hooks/useDrumKeyboard.test.tsx`.
- **Observed:** Tests cover basic mapping, repeat, focus in common editable controls, modifier keys, click, Enter/Space, hit-list limit, meter **presence**, and a mocked rejected `play()`. They do **not** actually test `visibilitychange` cleanup, nested editable descendants, the real WAV `fetch`/decode error path, audio concurrency, live-region throttling/repeated messages, or meter measurements. The audio engine is completely mocked in component tests.
- **How to recognize/reproduce:** Search the tests for `visibilitychange`, `fetch`, `decodeAudioData`, `getFloatTimeDomainData`, `advanceTimersByTime`, and actual concurrent playback. Verify that the T09 checklist requires more than the currently implemented assertions.
- **Recommended fix:** Add focused tests for each missing behavior, including an `AudioEngine.test.ts` with mocked Web Audio nodes/fetch and a fake analyser test for the signal meter. Add fake-timer tests for the 1.2-second live-status batches. If a test is intentionally manual, link the actual test result in `accessibility_audit.md`. Reset any checklist item that has not been verified.
- **Regression check:** Run `npm run test`, `npm run lint`, and `npm run build`; inspect **individual test cases**, not only the total pass count.

### F-05 — Sound attribution/license records are missing

- **Priority / state:** **Medium — Confirmed missing documentation, licensing status unknown.**
- **Location:** `app/public/sounds/` and `task_decomposistion.md` T02; `app/README.md:102–107` refers to `app/public/sounds/README.md`.
- **Observed:** Seven playable-format WAV files exist, but no sound-credit/attribution manifest was supplied; the T02 item is checked. Valid WAV files do not establish permission to redistribute them.
- **How to recognize/reproduce:** Check for `app/public/sounds/README.md` and trace each `.wav` to the original source and license.
- **Recommended fix:** Create `Homework_1/app/public/sounds/README.md` with **filename, original source/URL, author, license, and any required attribution**. If self-recorded, state that accurately. If a license cannot be established, replace the sample with one you are authorized to use. **Do not invent credits or licenses.**
- **Regression check:** Every listed sample has traceable provenance and appropriate redistribution permission.

### F-06 — Two equivalent keyboard test files duplicate six cases

- **Priority / state:** **Medium — Confirmed.**
- **Location:** `app/src/hooks/useDrumKeyboard.test.tsx` and `app/src/test/useDrumKeyboard.test.tsx`.
- **Observed:** Both files contain the same six `it(...)` scenarios, differing only in relative import paths. Together with eight DrumKit tests, the source contains **20 test declarations, but only 14 distinct scenarios**.
- **How to recognize/reproduce:** Compare the two test files; run `npm run test` and observe both suites being discovered.
- **Recommended fix:** Keep the colocated `src/hooks/useDrumKeyboard.test.tsx`; delete the duplicate `src/test/useDrumKeyboard.test.tsx` **after verifying it adds no unique cases**. Keep `src/test/setup.ts`, which remains necessary.
- **Regression check:** Only two test files run, with **14 current unique test declarations** before adding any new regression tests. Test count may subsequently increase as F-04 is addressed.

### F-07 — Stray JSX expression after the `DrumKit` component

- **Priority / state:** **Medium — Confirmed dead code; not a demonstrated build failure.**
- **Location:** `app/src/components/DrumKit.tsx:149–154`.
- **Observed:** A standalone `<p id="drum-kit-instructions">...</p>` occurs **after** the component's closing `}`. A different paragraph with the same intended ID is already rendered correctly at lines 113–117. The extra JSX expression is outside the React render tree.
- **How to recognize/reproduce:** Scroll to the end of `DrumKit.tsx`; compare the two paragraph blocks. The independent TypeScript check passed, so this should **not** be reported as a proven compiler error.
- **Recommended fix:** Delete lines 149–154. If the additional sentence is wanted, insert it inside the existing paragraph in `return`:

  ```tsx
  <p id="drum-kit-instructions">
    Focus here, then press W A S D J K L.
    Use Tab to navigate pads.
    Press Enter or Space to activate a focused pad.
    You can also click or tap any pad to play.
  </p>
  ```

- **Regression check:** Exactly one `drum-kit-instructions` element is rendered; all named controls and keyboard shortcuts still work; build/lint pass.

### F-08 — Older async audio failure can overwrite a newer success

- **Priority / state:** **Medium — Valid race possibility; runtime reproduction recommended.**
- **Location:** `DrumKit.tsx:60–93`.
- **Observed:** Every activation calls `setAudioError('')`, then `await engine.play(code)`. If an older request fails **after** a newer request succeeds, the older catch block can display an outdated failure even though the last pad played successfully.
- **How to recognize/reproduce:** In a test, make the first mocked `play()` return a deferred promise and the second resolve immediately. Trigger two different pads, resolve the second, then reject the first. Check whether the stale error remains visible.
- **Recommended fix:** If the intended UX is **latest-action status**, use a monotonically increasing activation ID in a ref and only show an error when it belongs to the latest activation. Alternatively, maintain a separate bounded error history rather than a single global string. Document the chosen policy.
- **Regression check:** Out-of-order playback promises produce accurate feedback and never crash the UI.

### F-09 — Active-pad visual indication varies by input method

- **Priority / state:** **Medium — Needs browser verification; not automatically a WCAG violation.**
- **Location:** `DrumKit.tsx:95–128`, `DrumPad.tsx:16–25`, `App.css:71–76`.
- **Observed:** `data-active` comes only from `activeCodes` in the physical keyboard hook. Click/Enter/Space call the playback pipeline but do **not** update `activeCodes`. CSS `:active` can still provide temporary pointer/keyboard-press feedback, but feedback may be inconsistent across devices or after release.
- **How to recognize/reproduce:** Compare visual feedback for holding W, mouse click, touch, Enter, and Space. Verify that the pressed feedback is perceivable and does not rely on color alone.
- **Recommended fix:** If uniform hit feedback is required, use a short transient activation state in the shared `handleTrigger` path for **all** input methods, while preserving the held-key state from the hook. Use a timer with cleanup and keep native `<button>` semantics. Do not set persistent `aria-pressed` on a momentary hit button merely to create a visual effect.
- **Regression check:** Every activation source gets equivalent visual confirmation without double-playing audio and respects `prefers-reduced-motion`.

### F-10 — Documentation paths and project status do not match delivered files

- **Priority / state:** **Medium — Confirmed.**
- **Location:** `Homework_1/app/README.md`; `Homework_1/task_decomposistion.md:1–7` and T11.
- **Observed:** The README is inside `app/`, while the planned submission structure names `Homework_1/README.md`. The README describes an `accessibility_audit.md` that is absent. `task_decomposistion.md` still says `Status: Planning — implementation not started` while T01–T11 are marked complete.
- **How to recognize/reproduce:** Compare the ZIP directory tree with the README's Project Structure section; read the task document's header and checklist.
- **Recommended fix:** Move/copy the project overview to `Homework_1/README.md` (or create a small HW1-level index linking to `app/README.md`); correct relative paths and instructions for someone starting from the repository root. Update status only after requirements and evidence actually match (e.g., `Implemented — audit corrections pending`).
- **Regression check:** From a new clone, the installation commands resolve, the expected files exist, and the task status reflects current evidence.

### F-11 — Slide examples versus justified accessibility semantics

- **Priority / state:** **Review — Not inherently a software defect.**
- **Location:** Slide's `aria-pressed={isActive}` example; `DrumPad.tsx`; `HitLog.tsx`.
- **Observed:** The slide mentions toggle-style `aria-pressed` and an `<output aria-live="polite">` with hit history. The implementation deliberately omits `aria-pressed` from momentary drum pads and uses `<output>` for a concise spoken summary plus a separate `<ol>` for visible history.
- **Why this is nuanced:** WAI-ARIA defines `aria-pressed` for **toggle buttons**; automatically applying it to momentary drum hits would misrepresent their function. The separate status/history pattern reduces announcement flooding, but a strictly literal grading rubric may expect a different markup arrangement.
- **How to recognize/reproduce:** Compare the slide's exact text to the JSX, then review with the instructor or rubric. Check the resulting accessibility tree and status announcements, not only a source-code string match.
- **Recommended fix:** Preserve truthful semantics unless the requirement is clarified. Include a short design rationale in the HW1 README and, if needed, ask whether a momentary-button implementation with a separate live status is accepted.
- **References:** [MDN `aria-pressed`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-pressed), [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

## 3. Verified strengths (do not rewrite unnecessarily)

- `drumPads.ts` maps seven unique `KeyboardEvent.code` values to seven existing local WAV files.
- The hook filters `event.repeat`, IME composition, Ctrl/Alt/Meta combinations, and ordinary editable controls; it scopes shortcuts to the focused Drum Kit and cleans up registered listeners.
- Pads are native HTML buttons with instrument names and printed-key labels.
- Audio uses lazy `AudioContext` initialization, decoded-buffer caching, gain/compression, an analyser, and cleanup.
- Hit history is bounded to 12 entries, and the level display uses dBFS rather than falsely claiming physical dB SPL.
- CSS includes visible focus, responsive layout rules, reduced-motion handling, and Windows forced-colors handling.
- The snapshot's 7 audio files passed **format/header** validation; this is not a substitute for listening tests.

## 4. Recommended correction order

1. **First:** Fix F-01 (add `role="group"`) and F-02 (ensure repeated live messages change), then add the missing regression tests in F-04.
2. **Before submission:** Produce real WCAG/Lighthouse evidence (F-03) and identify audio licenses (F-05). Do not assert 100/100 or WCAG conformance without evidence.
3. **Code cleanup:** Remove the orphan JSX (F-07), deduplicate the test suites (F-06), and address async error status (F-08) if reproduced.
4. **UX and rubric:** Verify all activation feedback (F-09); reconcile semantics with the literal assignment (F-11).
5. **Documentation:** Fix README paths and task-status claims (F-10), then rerun the complete verification checklist.

## 5. Re-test and evidence checklist

Run on the **student's Windows machine**, inside `Homework_1/app`:

```bash
npm ci
npm run test
npm run lint
npm run build
npm run preview
```

Then manually verify, and record results rather than presuming success:

- [ ] Tab/Shift+Tab focus navigation and visible outline; named Drum Kit group and seven named buttons.
- [ ] W/A/S/D/J/K/L: correct sounds, no OS repeat flood, no shortcut activation outside focused scope.
- [ ] Input/textarea/select/contenteditable, including editable descendants, never trigger a pad.
- [ ] Enter/Space/click/touch have correct behavior and no double activation.
- [ ] Two separate **Kick** hits produce two visible history records **and** meaningful screen-reader feedback.
- [ ] Missing/corrupt WAV, blocked autoplay, rapid distinct keys, and out-of-order audio failures do not crash or mislead users.
- [ ] Log is capped at 12; active-pad and meter behavior remain clear.
- [ ] 320 px, 200% text resize, 400% zoom, keyboard focus, contrast, and reduced motion are tested.
- [ ] Production Lighthouse Desktop/Mobile scores and axe findings are exported with date/environment.
- [ ] An actual NVDA/Chrome or equivalent screen-reader test is recorded.
- [ ] README paths, asset licenses, audit evidence, and task-decomposition checkmarks agree with what is actually in the repository.

**Final status for the uploaded snapshot: NOT YET VERIFIED FOR SUBMISSION.** The source has important correct patterns, but the confirmed accessibility/documentation issues and unverified criteria prevent a defensible claim of complete WCAG 2.2 AA conformance or Lighthouse Accessibility 100/100.

---

### Standards and references

- [WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/)
- [Understanding WCAG SC 2.1.4 — Character Key Shortcuts](https://www.w3.org/WAI/WCAG21/Understanding/character-key-shortcuts.html)
- [ARIA in HTML — role and naming constraints](https://www.w3.org/TR/html-aria/)
- [MDN — `aria-pressed` semantics](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-pressed)
