# AI Failure Audit - Lab 3 Homework 1

**Project:** Production Studio Drum Kit (React + TypeScript + Vite)  
**Scope:** F-01 and F-02 only. Findings F-03 through F-11 have been removed as requested.  
**Source reviewed:** `24520089_DangHoangAnh_Lab03_Hw.zip` (snapshot from November 4, 2026).

> Note: This document records findings from the submitted ZIP. Changes made in the local repository after that ZIP was uploaded have not been independently rechecked.

## Summary

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| F-01 | High | Missing semantic role on the labeled Drum Kit focus container | Reported fixed; verify in browser |
| F-02 | High | Repeated identical live-region messages may not be announced | Fix advised; verification pending |

## F-01 - Drum Kit focus container is missing a suitable role

**Location:** `Homework_1/app/src/components/DrumKit.tsx`.

**Problem:** A focusable `div` has `aria-label="Drum kit keyboard area"` and `aria-describedby`, but no explicit semantic role. Generic elements are not reliably exposed with author-provided accessible names.

**How to detect:** In Chrome DevTools, inspect the Drum Kit container in the Accessibility pane. Check its computed Role and Name. Also scan the page with axe DevTools and, if available, navigate with NVDA.

**Fix:** Add `role="group"` to the existing focus container, leaving its keyboard and children logic intact.

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

**Verify:** The accessibility tree reports Role = `group` and Name = `Drum kit keyboard area`. Tab, Shift+Tab, W/A/S/D/J/K/L, and activation by mouse still work.

**Status:** User reported F-01 fixed. Final browser verification should be recorded before calling it fully verified.

## F-02 - Repeated drum hits may not update live announcements

**Location:** `Homework_1/app/src/components/DrumKit.tsx` and `HitLog.tsx`.

**Problem:** If separate hits produce the same announcement (for example, `Kick drum triggered.` twice), React can preserve the same text. Some screen readers may not announce the second hit because the live region did not change.

**How to detect:** Focus the Drum Kit, press W, wait more than 1.2 seconds, and press W again. Inspect the `<output>` content and test with NVDA + Chrome. The visible Hit Log may register both hits even if only the first announcement is spoken.

**Fix:** Include the latest hit sequence identifier in the live announcement. Inside the existing 1.2-second timer, use:

```tsx
const latestHitId = hitIdRef.current;

setAnnouncement(
  count === 1
    ? `Hit ${latestHitId}: ${latest} drum triggered.`
    : `${count} drum hits triggered. Latest: ${latest}. Hit ${latestHitId}.`
);
```

**Verify:** Two separate W hits produce distinct messages (`Hit 1`, `Hit 2`, etc.). Rapid sequences remain batched, focus does not move, and NVDA announces each separate update when tested.

**Status:** Fix instructions provided; user has not yet confirmed completion.

## Final verification checklist

Run from `Homework_1/app`:

```bash
npm run test
npm run lint
npm run build
```

- [ ] F-01: Computed role and accessible name verified in the browser.
- [ ] F-01: Keyboard and pointer interactions still work.
- [ ] F-02: Repeated identical drum hits produce distinct live-region text.
- [ ] F-02: Screen-reader behavior checked manually (NVDA + Chrome, if available).
- [ ] Both fixes: Automated tests, lint, and production build pass.

**References:**
- [W3C WCAG 2.2 - Status Messages (4.1.3)](https://www.w3.org/TR/WCAG22/#status-messages)
- [W3C ARIA in HTML](https://www.w3.org/TR/html-aria/)
