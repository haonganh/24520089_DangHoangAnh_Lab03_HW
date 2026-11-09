# Task Decomposition — Lab 3 Homework 3

## KRAFTON × PUBG Vietnam Championship & Airdrop Arena

**Course:** Web Application Development — Practical Lab 3  
**Stack:** React 19 + TypeScript + Vite + Vitest  
**Accessibility target:** WCAG 2.2 Level AA  
**Companion document:** [`ai_rule.md`](./ai_rule.md)  
**Required final audit:** `AI_FAILURE_AUDIT.md` (at least **3 real, evidenced AI-generated bugs**; instructor slide indicates **15% weighting**)  
**Git workflow:** One focused Conventional Commit per completed task, then push to the Lab 3 repository.  
**Status:** Planning checklist; every task starts unchecked.

> **Important source clarification:** Both instructor slides explicitly identify **Lab 2 HW3** as the source of the anti-drift timer and optimistic inventory state machine. The supplied Lab 2 ZIP confirms this source. **Lab 2 HW2** contains an audio FIFO queue; its AbortController/cancellation ideas are optional supporting references, not the primary implementation for this assignment. **Slide 22 Virtual Scroller** is referenced by the assignment but is not implemented by the Lab 2 HW3 files inspected; build/adapt it as a separate component.

## 1. Instructor requirements and acceptance evidence

| ID | Requirement from slides | Acceptance evidence |
| --- | --- | --- |
| R01 | Transform Lab 2 HW3 into a KRAFTON × PUBG Vietnam / PVS Finals airdrop and ticket arena | PUBG-themed, clearly labeled **unofficial demo**, with tickets, G-Coin crates, leaderboard and kill feed |
| R02 | Preserve instructor domain contract in `pubg-vn-arena-contract.ts` | Exact `DropPhase`, `PubgCrateDrop`, `PubgVnSquadStanding` fields and types; type checks |
| R03 | Zero-drift `usePubgAirdropTimer(targetEpochMs, serverOffsetMs)` | Absolute `Date.now()`-based deadline; frame/interval sync; immediate `visibilitychange` resync; cleanup; background-tab tests |
| R04 | Optimistic crate/ticket claims with inventory lock and **HTTP 409 rollback** | UI immediately decrements once; successful claims commit; simulated 409 restores stock exactly once; rapid double-click is blocked |
| R05 | Distinct drop phases | `WARMUP`, `AIRDROP_LIVE`, `LOOTED_OUT`, `EXPIRED` with deterministic transitions and accessible text |
| R06 | Live PUBG VN leaderboard and kill-feed filters | Four slide-mentioned squads, WWCD/placement/kill scoring, sort/filter, empty state and updating demo data |
| R07 | Adapt Slide 22 Virtual Scroller | Windowed rendering for large mock datasets; documented accessible full-list alternative |
| R08 | **Mandatory** AI failure audit (15% slide weight) | `AI_FAILURE_AUDIT.md`: ≥3 **actually observed** defects; reproduction, DevTools/test proof, manual fix, regression, commit |
| R09 | WCAG 2.2 Level AA | Keyboard, status announcements, contrast, focus, target size, zoom/reflow, screen-reader/manual audit |
| R10 | Verification and submission | Unit/integration tests, `npm run build`, lint, React DevTools, screenshots, README, Git history/push |

### 1.1 Required slide contract

Create `Homework_3/app/src/domain/pubg-vn-arena-contract.ts` with these exports **unchanged**:

```ts
export type DropPhase =
  | 'WARMUP'
  | 'AIRDROP_LIVE'
  | 'LOOTED_OUT'
  | 'EXPIRED';

export interface PubgCrateDrop {
  readonly id: string;
  readonly title: string;
  readonly priceVnd: number;
  readonly remainingStock: number;
  readonly dropEpochMs: number;
}

export interface PubgVnSquadStanding {
  readonly squadId: string;
  readonly squadName: string;
  readonly wwcdCount: number;
  readonly placementPts: number;
  readonly killPts: number;
}
```

Use additional types **outside** these interfaces for claim status, server version, kill-feed events, claim-window duration and local demo state. The slides use a four-team scenario: The Expendables, Cerberus Esports, Roy Esports and AGG. Use fictional/mock scores, not unverified official results.

### 1.2 Migration map confirmed from the supplied Lab 2 ZIP

| Existing Lab 2 source | Actual behavior | Lab 3 HW3 adaptation |
| --- | --- | --- |
| `Homework_3/app/src/timer/anti-drift-timer.ts` | `createAntiDriftTimer(durationMs, onTick)` uses `Date.now()` absolute target and `requestAnimationFrame`; returns cleanup | Preserve the *absolute deadline* approach; build `usePubgAirdropTimer` driven by `targetEpochMs + serverOffsetMs`, including tab-wake resync |
| `Homework_3/app/src/timer/anti-drift-timer.test.ts` | Tests start time, delayed frames/drift, cleanup, invalid duration | Extend with server-offset changes, hidden-tab gaps, zero boundary, stale closure and StrictMode cleanup |
| `Homework_3/app/src/inventory/inventory-machine.ts` | Pure reservation FSM: `RESERVE → CHECKOUT → SOLD`; `CANCEL`/`EXPIRE_LOCKS` restore capacity; versioned inventory | Adapt immutable transitions to crate/ticket claims; add optimistic request IDs, server response and 409 rollback |
| `Homework_3/app/src/inventory/inventory-machine.test.ts` | Tests 20 requests against 5 stock, duplicate reservation, transitions, cancel, expiry, invalid stock | Add 409, duplicate-click, stale/out-of-order response, retry and invariant tests |
| `Homework_3/app/src/components/CountdownTimer.tsx` | UI for duration-based flash-sale countdown | Replace with a drop-epoch/offset countdown without restarting when re-rendered |
| `Homework_3/app/src/components/FlashSaleInventory.tsx` | Flash-sale UI and simulated reservation/checkout | Convert to PUBG crate/ticket claims, accessible pending/error/confirmed states |
| `Homework_2/app/src/audio/audio-queue-controller.ts` | FIFO audio tasks, `AbortController` and cancellation | **Optional reference only:** cancellation/late-result patterns for simulated network requests; do not copy audio-specific code into HW3 |

**Architectural boundary:** This assignment can use a mock server to demonstrate conflicts. A client-side-only application **cannot guarantee real cross-user stock atomicity, anti-cheat security, or authoritative server time**. Explain the limitation in the README. Do not claim official KRAFTON/PUBG affiliation.

## 2. Proposed folder structure

```text
24520089_DangHoangAnh_Lab03_Hw/
└── Homework_3/
    ├── ai_rule.md
    ├── task_decomposition.md
    ├── AI_FAILURE_AUDIT.md        # create during development; >=3 verified bugs
    ├── README.md
    ├── evidence/
    │   ├── timer-background.png
    │   ├── claim-409-rollback.png
    │   ├── leaderboard-filter.png
    │   ├── react-profiler.png
    │   ├── test-results.png
    │   └── wcag-audit.png
    └── app/
        ├── package.json
        ├── index.html
        ├── src/
        │   ├── domain/
        │   │   └── pubg-vn-arena-contract.ts
        │   ├── data/
        │   │   └── demoFixtures.ts
        │   ├── timer/
        │   │   └── airdropClock.ts
        │   ├── hooks/
        │   │   └── usePubgAirdropTimer.ts
        │   ├── inventory/
        │   │   └── claim-machine.ts
        │   ├── services/
        │   │   └── mockClaimApi.ts
        │   ├── leaderboard/
        │   │   └── leaderboardSelectors.ts
        │   ├── components/
        │   │   ├── AirdropCountdown.tsx
        │   │   ├── CrateClaimCard.tsx
        │   │   ├── ArenaLeaderboard.tsx
        │   │   ├── KillFeed.tsx
        │   │   └── VirtualLeaderboard.tsx
        │   ├── App.tsx
        │   ├── App.css
        │   └── index.css
        └── ... colocated `*.test.ts` / `*.test.tsx` files
```

File names are proposed for task sequencing, **except** the required slide contract and hook API. Adjust component boundaries as needed and keep documentation accurate.

## 3. Sequential tasks (commit after every completed task)

### T00 — Establish documents before writing application code

- [ ] Create `Homework_3/` inside the **existing Lab 3** repository (not the Lab 2 repository).
- [ ] Save this `task_decomposition.md` and `ai_rule.md` inside `Homework_3/` before implementation.
- [ ] Review the instructor slides; record required domain contract and three major features.
- [ ] Confirm working branch and remote (`git status`, `git remote -v`).
- **Done when:** Both Markdown files are tracked and pushed before feature code.
- **Commit:** `docs(hw3): add task plan and WCAG 2.2 AA AI rules`

### T01 — Scaffold React 19 + TypeScript, Vite, and test tooling

- [x] Create `Homework_3/app` with the React + TypeScript Vite template; confirm compatible React version and TypeScript config.
- [x] Install dependencies; configure Vitest, jsdom, React Testing Library and user-event as needed.
- [x] Add scripts for `dev`, `test`, `build`, `lint`; preserve lockfile.
- [x] Replace Vite starter content with accessible semantic `<header>`, `<main>` and `<footer>` placeholders.
- **Done when:** `npm run dev`, `npm run test`, `npm run build` and `npm run lint` are runnable (tests may initially be a simple smoke test).
- **Commit:** `chore(hw3): initialize React TypeScript arena app`

### T02 — Audit and adapt Lab 2 sources (not a blind copy)

- [x] Open the exact Lab 2 HW3 files listed in Section 1.2; identify reusable pure timing and inventory logic.
- [x] Preserve proven constraints: nonnegative integer stock, duplicate ID rejection, legal transitions, idempotent cleanup and simulated concurrency.
- [x] Record differences: duration vs absolute epoch, single inventory vs per-drop stock, local checkout vs async 409 confirmation.
- [x] Copy/adapt relevant unit-test scenarios; do **not** import an entire Lab 2 app or mix repositories.
- **Done when:** Migration notes identify source modules and changes, and no Lab 2 repo files are modified.
- **Commit:** `docs(hw3): map Lab 2 timer and inventory reuse`

### T03 — Implement domain contract and Vietnamese scenario fixtures

- [x] Implement `DropPhase`, `PubgCrateDrop` and `PubgVnSquadStanding` **exactly** as specified in Section 1.1.
- [x] Add typed demo fixtures for a **PVS Finals VIP Pass + 5,000 G-Coin** bundle and a G-Coin crate, with valid stock and epoch timestamps.
- [x] Provide four named Vietnamese tournament squad fixtures; clearly label scores as demonstration data.
- [x] Add a type-safe VND formatter using `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`.
- [x] Validate nonnegative stock, finite timestamps/prices and unique IDs; do not add mutable fields to readonly contract objects.
- **Done when:** Types compile and format/validation unit tests pass.
- **Commit:** `feat(hw3): define PUBG Vietnam arena domain and fixtures`

### T04 — Build anti-drift clock utilities using absolute epochs

- [x] Implement pure functions for `remainingMs = Math.max(0, targetEpochMs - (Date.now() + serverOffsetMs))`.
- [x] Validate finite target/offset and handle `0` boundary consistently; round only for **display**, not state logic.
- [x] Preserve Date.now-based calculation from Lab 2 HW3 rather than `seconds - 1` timers.
- [x] Test delayed callbacks, large fake clock jumps, negative/positive offsets and expired drops.
- **Done when:** A delay or background gap does not accumulate countdown error.
- **Commit:** `feat(hw3): implement absolute epoch anti-drift clock`

### T05 — Implement `usePubgAirdropTimer` and tab visibility resync

- [x] Export `usePubgAirdropTimer(targetEpochMs: number, serverOffsetMs = 0)` from `src/hooks/usePubgAirdropTimer.ts`.
- [x] Derive remaining time from **current** target/offset; never capture obsolete values in a stale closure.
- [x] Schedule reasonably paced updates using `requestAnimationFrame` or a 250 ms interval (as illustrated on the slide), with a bounded React state update rate.
- [x] Immediately resync on `document.visibilitychange` when the page becomes visible; subscribe/cleanup correctly and avoid duplicate timers in StrictMode.
- [x] Provide a stable return contract (`remainingMs`, `isLive` or an equivalent documented shape) and graceful unmount.
- [x] Write hook tests using mocked time and `visibilityState`/events.
- **Done when:** Leaving a tab inactive then returning shows the correct remaining time without timer reset or drift.
- **Commit:** `feat(hw3): add visibility-aware airdrop timer hook`

### T06 — Implement finite drop phases and readable countdown UI

- [x] Derive `WARMUP`, `AIRDROP_LIVE`, `LOOTED_OUT` and `EXPIRED` from clock, stock and an explicit demo claim-window policy.
- [x] Define precedence: **expired window → EXPIRED**; otherwise **zero stock → LOOTED_OUT**; otherwise live/warmup by epoch. Document this decision.
- [x] Display meaningful `dd:hh:mm:ss` or `hh:mm:ss` based on remaining time, with visible units and phase labels.
- [x] Update live regions only for meaningful **phase changes**; do not announce each frame/second to screen readers.
- [x] Add tests for boundary conditions (before, at, after epoch, zero stock, after claim window).
- **Done when:** Phase messages are accessible, deterministic, and do not depend on browser tab activity.
- **Commit:** `feat(hw3): add accessible airdrop phases and countdown UI`

### T07 — Adapt Lab 2 inventory FSM for crate/ticket claims

- [x] Extract a pure reducer/module based on Lab 2 HW3 `inventory-machine.ts`, with per-drop stock/reservations.
- [x] Define states such as `IDLE`, `PENDING`, `CONFIRMED`, `ROLLED_BACK`, `REJECTED` and stable request IDs; distinguish client state from mock-server state.
- [x] On claim, reserve only one available unit and record the original transaction; use immutable transitions.
- [x] Prevent negative stock, duplicate reservation, double settlement, and invalid transitions.
- [x] Add tests for five-stock/twenty-request competition, zero stock, duplicate requests, success and rollback.
- **Done when:** Every accepted claim changes available stock once, and every rejected claim restores only its own optimistic decrement.
- **Commit:** `feat(hw3): adapt optimistic crate inventory state machine`

### T08 — Implement asynchronous mock claim API and HTTP 409 rollback

- [ ] Create a cancellable mock API that can respond success, **409 Conflict / LOOTED_OUT**, and other errors.
- [ ] Simulate delay and out-of-order responses to exercise optimistic concurrency; do not pretend browser-local mocks are globally authoritative.
- [ ] Implement explicit `claimId` matching so stale/duplicate responses cannot commit or roll back the wrong claim.
- [ ] Roll back exactly once on 409 and refresh/reconcile displayed stock with the mock authoritative result.
- [ ] Abort outstanding requests on unmount/reset; prevent late results from mutating UI after cancellation.
- [ ] Add integration tests: success, 409, network failure, duplicate-click race, retry, stale response and unmount cleanup.
- **Done when:** A forced 409 restores stock and explains the conflict without an uncaught error.
- **Commit:** `feat(hw3): handle claim conflicts and idempotent rollback`

### T09 — Build accessible claim cards and user feedback

- [ ] Display crate/ticket title, VND price, available stock, phase, and a clearly labeled **Claim** button.
- [ ] Use a synchronous in-flight guard (for same-event-loop double clicks) plus visible `disabled` while pending; keep an accessible outcome message.
- [ ] Present pending/confirmed/409/expired states in text, not color alone; link error text to the affected claim.
- [ ] If a claim is treated as a purchase, require a review/confirmation step or a reversible action consistent with relevant WCAG error-prevention requirements.
- [ ] Restore/move focus sensibly after async changes; do not trap focus in a removed control.
- **Done when:** Keyboard and pointer users can make, cancel/retry and understand simulated claims.
- **Commit:** `feat(hw3): build accessible crate and ticket claim interface`

### T10 — Implement leaderboard sorting and selectors

- [ ] Provide selectors for sorting by **WWCD**, **placement points**, **kill points**, with deterministic stable tie-break (`squadId`).
- [ ] Provide typed sort direction and text/team filters; use `useMemo` for derived arrays, not an effect that mirrors props into state.
- [ ] Display visible column labels, ordering direction, and score definitions; distinguish mock scores from official results.
- [ ] Test ordering, ties, empty lists, nonmutation of source fixtures and locale-aware team search.
- **Done when:** Filters/sorts are correct and do not rewrite the original data.
- **Commit:** `feat(hw3): add PUBG squad leaderboard sorting and filters`

### T11 — Implement live kill-feed and user-controlled updates

- [ ] Define a typed mock kill-feed event: unique ID, squad, player/description, timestamp and points where needed.
- [ ] Support filters by team and/or kill point/event type, with clear/reset actions.
- [ ] Provide bounded demo updates (manual **Add Demo Event** or an optional toggle for automatic updates); clean up intervals/subscriptions.
- [ ] Offer **Pause/Resume live feed** without pausing the authoritative drop deadline; avoid unexpected focus changes.
- [ ] Avoid chatty `aria-live` announcements for every simulated event; announce only a concise summary or user-triggered changes.
- **Done when:** Feed updates, filtering, pause/resume and empty states are independently testable.
- **Commit:** `feat(hw3): add filterable PUBG VN kill feed`

### T12 — Integrate Slide 22 Virtual Scroller accessibly

- [ ] Build a fixed-row-height virtual window with overscan for large synthetic leaderboards (e.g. 100–200 test rows); make row height and viewport responsive.
- [ ] Preserve item order and stable IDs; render enough context to avoid disappearing focused items during keyboard navigation.
- [ ] Provide an **accessible show-all / nonvirtualized table or list mode** for screen-reader and keyboard users, since DOM-windowing hides off-screen rows from the accessibility tree.
- [ ] Keep header/filters outside the scroll viewport; expose total results and visible range as readable text.
- [ ] Test initial window, scrolling, focus retention, filtered list length and accessible fallback mode.
- **Done when:** Large demo lists render efficiently without making off-screen squads unreachable.
- **Commit:** `feat(hw3): add accessible virtual leaderboard view`

### T13 — Integrate arena UI and WCAG 2.2 AA styling

- [ ] Assemble semantic landing, event details, airdrop countdown, claim inventory, leaderboard, filter controls and kill feed.
- [ ] Make mobile/desktop layouts robust at **320 CSS px** and at **400% browser zoom**; avoid viewport-width clipping of primary controls.
- [ ] Meet text contrast ≥ **4.5:1** for normal text / ≥ **3:1** for large text; component/focus-state indicators ≥ **3:1** where required.
- [ ] Provide visible `:focus-visible`, focus not obscured by sticky elements, target size ≥ **24×24 CSS px** or valid spacing exception (prefer 44×44), and logical heading/order.
- [ ] Honor `prefers-reduced-motion` and forced-colors; support 200% text resizing and text spacing.
- [ ] Use `lang="vi"` if primary on-screen UI is Vietnamese; ensure English product terms are still intelligible.
- [ ] Do not use unauthorized official logos/artwork or claim affiliation; label scenario as fictional/demo.
- **Done when:** All key interactions are keyboard operable and the manual accessibility matrix in Section 4 is checked.
- **Commit:** `style(hw3): implement responsive WCAG 2.2 AA arena UI`

### T14 — Deterministic regression tests and React DevTools verification

- [ ] Run all existing Lab 2-derived timer/inventory regressions **adapted to the new domain**.
- [ ] Add hook, claim API, reducer, virtual list, leaderboard, kill-feed and keyboard integration tests.
- [ ] Use Vitest fake timers/system time and controllable Promise resolution to reproduce hidden-tab jumps and 409 races.
- [ ] React DevTools **Profiler**: verify unnecessary re-renders are avoided for unaffected rows/claim cards; record a screenshot.
- [ ] React DevTools Components/Chrome DevTools: verify interval/listener cleanup and no stale closure after target/offset changes.
- [ ] Run `npm run test`, `npm run build`, `npm run lint`; do not mark checks as passed until real output confirms them.
- **Done when:** Tests pass, screenshots are real, and there are no unresolved build/lint failures.
- **Commit:** `test(hw3): verify timer claims leaderboard and accessibility`

### T15 — Complete mandatory AI failure audit, README, and submission

- [ ] Create **`Homework_3/AI_FAILURE_AUDIT.md`** (exact slide filename), with **≥3 distinct defects actually introduced or suggested by AI** and detected during development.
- [ ] For each defect: initial AI code/behavior; precise file and location; reproduction; **real** DevTools or failing-test evidence; root cause; manual fix; regression; commit hash; before/after status.
- [ ] Potential *investigation categories*, **not preapproved findings**: stale-closure timer, missing effect cleanup, 409 rollback/double-click, derived-state render loops, inaccessible virtual list. Use only defects that really occur.
- [ ] Write `Homework_3/README.md`: setup, features, architecture, Lab 2 migration, scope limits, tests, WCAG evidence, audit index, screenshots and how to run demo.
- [ ] Save relevant authentic screenshots under `Homework_3/evidence/` and update this task checklist; commit after the evidence exists.
- [ ] Check `git status`, `git log --oneline -18`, `git remote -v`, push to the **Lab 3** remote, and verify files appear on GitHub.
- **Done when:** ≥3 evidenced bugs have fix/test/commit traces; README and audit are accurate; working tree clean and push successful.
- **Commit:** `docs(hw3): finalize AI failure audit and submission evidence`

## 4. WCAG 2.2 AA verification matrix

Check the **actual application**, not only the source code. WCAG conformance cannot be established by Lighthouse alone.

| Criterion | Concrete check for this homework | Verification |
| --- | --- | --- |
| 1.1.1 Non-text Content (A) | Informative images/icons have text alternatives; decorative content is hidden from assistive technology | Manual / accessibility tree |
| 1.3.1 Info and Relationships (A) | Headings, tables, scores, claim forms and filter labels are semantic | Accessibility tree |
| 1.4.1 Use of Color (A) | WARMUP/LIVE/409/success are never color-only | Manual |
| 1.4.3 Contrast (Minimum) (AA) | Text contrast ≥4.5:1, large text ≥3:1 | Contrast checker |
| 1.4.10 Reflow (AA) | Main functions work at 320 CSS px / 400% zoom without two-dimensional scrolling | Chrome responsive mode |
| 1.4.11 Non-text Contrast (AA) | Essential control boundaries/states ≥3:1 | Contrast checker |
| 1.4.12 Text Spacing (AA) | Layout survives increased letter/word/line/paragraph spacing | CSS injection/manual |
| 2.1.1 Keyboard (A), 2.1.2 No Keyboard Trap (A) | Claim, sort, filter, scroll fallback, pause/resume and dialogs operable by keyboard | Tab/Shift+Tab/Enter/Space/Escape |
| 2.2.1 Timing Adjustable (A) | Evaluate timed interaction; demo offers reasonable review/retry/extension where possible, or document applicable essential/real-time exceptions **only if justified** | Manual review |
| 2.2.2 Pause, Stop, Hide (A) | Automatically updating feed can pause; countdown authority remains independent | Manual |
| 2.4.3 Focus Order (A), 2.4.7 Focus Visible (AA) | Focus follows content order and is visibly highlighted | Keyboard walkthrough |
| 2.4.11 Focus Not Obscured (Minimum) (AA) | Sticky panels do not entirely hide focused controls | Zoom + keyboard |
| 2.5.3 Label in Name (A) | Visible labels appear in accessible names of controls | Accessibility tree |
| 2.5.8 Target Size (Minimum) (AA) | Targets are ≥24×24 CSS px or meet a documented exception; prefer 44×44 | DevTools measurements |
| 3.2.2 On Input (A) | Selecting sort/filter does not unexpectedly submit claims or steal focus | Manual |
| 3.3.1 Error Identification (A), 3.3.3 Error Suggestion (AA) | 409 and validation errors are textual, identify the problem and suggest retry/refresh | Manual + test |
| 3.3.4 Error Prevention (AA), where applicable | Confirm/review/reverse a consequential claim before final submission | Manual |
| 4.1.2 Name, Role, Value (A) | Native form controls and correct states; no clickable nonsemantic `<div>` | Accessibility tree |
| 4.1.3 Status Messages (AA) | Meaningful transitions and claim outcomes announced without moving focus; no per-second speech spam | Screen reader test |

**Recommended tools:** Chrome/Edge DevTools, Lighthouse, axe DevTools where available, React DevTools Profiler, keyboard-only walkthrough and at least one screen reader (NVDA/VoiceOver as available). Record the device/browser/date and any unresolved findings.

Normative reference: [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) and [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/).

## 5. Required test scenarios and evidence

| Scenario | Expected result | Suggested evidence filename |
| --- | --- | --- |
| Inactive browser tab for >60 seconds, then return | Countdown immediately reflects actual target epoch, no accumulated lost seconds | `timer-background.png` |
| Update `targetEpochMs` / `serverOffsetMs` during mount | Hook uses newest values; one timer/listener only | Hook test output / DevTools |
| 20 claim attempts for stock=5 | No negative local stock; accepted count ≤5 in deterministic mock server | Test result screenshot |
| Rapid double click | One pending claim per guard; stock decremented once | Test result screenshot |
| Server returns HTTP 409 after optimistic UI | Stock restored **exactly once**; status explains conflict; retry behavior defined | `claim-409-rollback.png` |
| 409 arrives after reset/abort | No stale mutation or ghost error | Unit test output |
| Leaderboard with four slide squads | Sort WWCD, placement, kills correctly and stably | `leaderboard-filter.png` |
| Virtual list 100+ demo rows | Bounded DOM rows, focus accessible, show-all alternative works | React DevTools screenshot |
| Keyboard-only and screen-reader navigation | All core tasks accessible, announcements meaningful | `wcag-audit.png` |
| React Profiler | Unaffected rows/components do not unnecessarily re-render | `react-profiler.png` |
| Vitest, build and lint | All commands complete without unreported errors | `test-results.png` |

## 6. Working commands and Git milestones

From **`Homework_3/app`**:

```powershell
npm install
npm run dev
npm run test
npm run build
npm run lint
```

From the **Lab 3 repository root**, after completing each task:

```powershell
git status
git add Homework_3/
git commit -m "feat(hw3): describe the completed task"
git push
```

Replace the example commit message with the **exact message** attached to the completed task. Commit only verified changes; do not manufacture old history or mark pending tasks complete. For T00, commit the two Markdown files first.

**Final definition of done:** Contract and features match the slides; timer drift and claim rollback tests pass; leaderboard/kill feed and virtual view work; WCAG 2.2 AA has evidence-backed review; `AI_FAILURE_AUDIT.md` contains at least three real documented failures; clean, traceable commits are visible in the Lab 3 GitHub repository.
