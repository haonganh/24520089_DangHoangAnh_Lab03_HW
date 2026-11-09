# AI Assistance Rules — Lab 3 Homework 3

## KRAFTON × PUBG Vietnam Championship & Airdrop Arena

**Course:** Web Application Development — Practical Lab 3  
**Primary language of this policy:** English  
**Implementation stack:** React 19, TypeScript, Vite, Vitest  
**Accessibility target:** WCAG 2.2 Level AA  
**Execution plan:** [`task_decomposition.md`](./task_decomposition.md)  
**Required audit:** `AI_FAILURE_AUDIT.md` (≥3 proven bugs; 15% weighting per instructor slide)

## 1. Role, priorities, and work mode

The AI is a **step-by-step implementation assistant and reviewer**, not an autonomous substitute for the student's verification or Git history. All guidance must follow the instructor slides, actual repository files and the task plan.

Priorities, in order:

1. Instructor-specified domain contract and required behavior.
2. Correctness and deterministic concurrency/rollback behavior.
3. WCAG 2.2 Level AA accessibility.
4. Resource safety, React lifecycle correctness and performance.
5. Clear explanation, tests, real evidence and scoped Git commits.
6. Visual polish and optional enhancements.

### Working protocol

- Work **one task at a time** (T00 → T15); when the student says `done`, move to the next unchecked task.
- Provide concise Vietnamese instructions during the chat, unless the student requests otherwise; keep source comments, commit messages and assignment Markdown in English.
- For each task, provide: **file path → exact change/complete copyable code if requested → verification command → expected outcome → Conventional Commit**.
- When the student asks for complete code, deliver a **complete file that matches the existing exports, imports, tests and package versions**. Do not silently rename APIs or omit existing logic.
- Avoid large one-shot implementations unless explicitly requested. Preserve previously working functionality.
- Ask at most one targeted question when an essential implementation fact is missing; otherwise use clearly labeled reasonable defaults.
- Do not claim a test, screenshot, DevTools profile, Git push or audit has succeeded unless the student has provided actual output or a tool has verified it.
- Never invent file paths, package scripts, code history, screenshots, commit hashes, external API responses, match scores or accessibility conformance.

## 2. Source reuse rules and assignment scope

The instructor's slides identify **Lab 2 HW3** as the basis for the new timer and inventory modules. The supplied Lab 2 archive contains these paths:

```text
Lab 2 / Homework_3/app/src/timer/anti-drift-timer.ts
Lab 2 / Homework_3/app/src/timer/anti-drift-timer.test.ts
Lab 2 / Homework_3/app/src/inventory/inventory-machine.ts
Lab 2 / Homework_3/app/src/inventory/inventory-machine.test.ts
Lab 2 / Homework_3/app/src/components/CountdownTimer.tsx
Lab 2 / Homework_3/app/src/components/FlashSaleInventory.tsx
```

Also available in **Lab 2 HW2**:

```text
Lab 2 / Homework_2/app/src/audio/audio-queue-controller.ts
Lab 2 / Homework_2/app/src/audio/audio-task.ts
```

**Mandatory source discipline:**

1. Reuse/adapt **HW3** timer and inventory principles as the primary source. HW2's FIFO audio code is **not** a substitute for a claim inventory reducer; its AbortController/late-result handling may inspire a cancellable mock API if useful.
2. Preserve the original Lab 2 repository. Create Lab 3 HW3 only under `24520089_DangHoangAnh_Lab03_Hw/Homework_3/`.
3. Explain any behavioral changes introduced by adapting Lab 2 code, especially from `durationMs` to `targetEpochMs`, and from synchronous reservation to async optimistic claim.
4. Do not claim Slide 22's Virtual Scroller already exists in Lab 2 HW3 source. Implement or adapt it separately, and provide a nonvirtualized accessible fallback.
5. Never copy entire source files blindly; validate APIs, cleanup, edge cases and tests after migration.
6. Do not use external PUBG/KRAFTON services or assert official access without explicit proof. Keep all inventory, scores and kill-feed events clearly identified as **simulated data**.

## 3. Mandatory instructor domain contract

Create `app/src/domain/pubg-vn-arena-contract.ts` with the fields and types specified by the slide:

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

Rules:

- Do **not** remove, rename or mutate these readonly fields.
- Put extra demo-model fields in separately named types; prefer discriminated unions for async claim statuses.
- Use the four instructor-mentioned squad names: **The Expendables, Cerberus Esports, Roy Esports, AGG**.
- Provide a **PVS Finals VIP Pass + 5,000 G-Coin** ticket/bundle and a G-Coin crate in the demo fixtures.
- Display `priceVnd` using `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`; use numeric values internally.
- Use deterministic fabricated scores and show **Demo scores — not official standings**. Do not infer real PVS results from the scenario.

## 4. Timer correctness and React hook rules

The required public hook is:

```ts
usePubgAirdropTimer(targetEpochMs: number, serverOffsetMs = 0)
```

**Absolute-time invariant:**

```ts
const remainingMs = Math.max(
  0,
  targetEpochMs - (Date.now() + serverOffsetMs)
);
```

- Never implement `setSeconds((s) => s - 1)` as a time source. It accumulates delay in background tabs.
- Do not rely on a `setInterval(1000)` tick count for correctness. An interval or animation frame may trigger a *recalculation*, not determine elapsed time.
- `Date.now()` is a wall clock, **not strictly monotonic**; serverOffsetMs is a demo clock-offset approximation, not a security guarantee. Do not promise submillisecond precision or immunity to operating-system clock changes.
- Resynchronize immediately on `visibilitychange` when `document.visibilityState === 'visible'`; also compute on mount and when target/offset changes.
- Use proper `useEffect` dependencies or stable event callbacks; never bind a stale target epoch or offset.
- Clean up `requestAnimationFrame`, `setInterval`, and `visibilitychange` listener on unmount and dependency changes. React StrictMode double-effect behavior must remain correct.
- Avoid unnecessarily updating React state every animation frame if the displayed value has not changed.
- Support valid future/past epochs and clear errors for invalid numbers.
- Define and test what happens exactly when `remainingMs === 0`.
- Announce **phase changes** rather than every countdown second to assistive technology.

## 5. Drop phase and claim-window rules

- Use only the exact domain phase literals: `WARMUP`, `AIRDROP_LIVE`, `LOOTED_OUT`, `EXPIRED`.
- Define a separate **demo claim-window duration**; do not add an unrequested field to `PubgCrateDrop` merely to make phase calculation work.
- Document deterministic precedence: after expiration use `EXPIRED`; before expiration, zero stock means `LOOTED_OUT`; otherwise use `AIRDROP_LIVE` if the drop has started, or `WARMUP` beforehand.
- Disable claims outside the live window or when no stock remains; do not permit clicks through temporary visual state changes.
- Calculate phase using current time + offset and current **authoritative demo server** stock; do not derive trusted stock solely from countdown status.
- Expose phase changes with readable text and programmatic status; do not rely on PUBG color styling alone.

## 6. Optimistic inventory and HTTP 409 rules

The Lab 2 HW3 `inventory-machine.ts` provides a starting point for immutable reservation transitions. Adapt it to the PUBG claim context, but maintain the following **hard invariants**:

1. Stock and reservations are nonnegative integers; available stock **never drops below zero**.
2. A claim has a unique, stable request ID; one request cannot be confirmed/rolled back more than once.
3. A synchronous in-flight lock prevents repeated claims from rapid double clicks, independently of React's asynchronous re-render.
4. Optimistic stock reduction applies **once**; successful server acknowledgment commits **once**.
5. An HTTP **409 Conflict** restores only the outstanding optimistic decrement for that request, **exactly once**. Reconcile against returned server stock/version where available.
6. Other errors (network failure, timeout, abort) have explicit policy and user-facing explanation; do not silently count a failed claim as a purchase.
7. Out-of-order responses, stale request IDs and unmount/reset must not corrupt the new state. Aborted requests must not update unmounted components.
8. Mock API responses must be deterministic/testable; the 409 path must be deliberately reproducible.
9. Preserve valid reservation transitions; illegal transitions throw controlled errors or produce safe rejected outcomes, never mutate state in place.
10. **Client-side simulated locks are not real multiuser backend atomicity.** An actual production ticket marketplace needs server-side conditional transactions, idempotency keys, verified deadline and authenticated stock authority.

**Required test cases:** stock=5 with 20 attempts; duplicate request ID; rapid two-click; server 200; 409 conflict; rollback exactly once; retry; request resolved after reset; cancellation on unmount; sold-out/expired claim; no negative count.

## 7. Leaderboard, kill feed and virtualization rules

- Implement WWCD (Winner Winner Chicken Dinner), placement points and kill points as explicit, sortable numeric fields.
- Sort deterministically; document whether sort is by selected field or composite ranking. Use `squadId` or stable original order as a tie-breaker.
- Never mutate readonly source data using `array.sort()` directly: use `[...data].sort(...)` or `toSorted()` where supported.
- Use memoized derived selectors (`useMemo`) when justified; **do not** add redundant derived `useState` synchronized by `useEffect`.
- Provide clear filter labels, selected states, sort direction and an empty-results message.
- Kill-feed events are synthetic and may be periodically generated only in a controlled demo; make automatic updates pausable and dispose timers.
- A virtual list only renders part of its data into the DOM. Therefore, provide a keyboard/screen-reader-friendly **Show all rows** (nonvirtualized) mode or equivalent accessible navigation with tested semantics.
- Preserve keyboard focus and stable row IDs across scroll, sort, filters and updates. Never remove the focused node without a focus-management strategy.
- For 4 base squads, prioritize readability; verify virtualization with a **larger synthetic test fixture**, not inflated fake official teams or results.
- Avoid putting `aria-live` around the entire updating leaderboard or kill feed; provide controlled summaries.

## 8. WCAG 2.2 Level AA — nonnegotiable requirements

Target all applicable Level A and AA Success Criteria, not only the new 2.2 criteria.

### 8.1 Semantic structure and perceivability

- Use a single descriptive `<h1>`, logical heading nesting, and `<main>`, `<header>`, `<nav>`, `<section>` as appropriate.
- Use native `<button>`, `<select>`, `<input>`, `<table>` and associated `<label>` wherever possible. Do not use clickable `<div>` or positive `tabIndex`.
- Give meaningful names to claim controls: e.g., **Claim PVS Finals VIP Pass** rather than vague **Claim** when multiple cards exist.
- Include text alternatives for meaningful logos/icons and hide decorative shapes with `aria-hidden="true"`.
- Convey phase, stock, claim conflict, leaderboard sort and active filters in text, not color alone (1.4.1).
- Target **4.5:1** contrast for normal text, **3:1** for large text (1.4.3), and required **3:1** for nontext UI indicators (1.4.11).
- Use semantic `<th scope="col">` and appropriately labeled sort buttons for a full leaderboard table.

### 8.2 Keyboard, focus and pointer targets

- Everything must work with Tab, Shift+Tab, Enter and Space; Escape where applicable. No keyboard traps (2.1.1/2.1.2).
- Use strong `:focus-visible` styles; do not remove the browser outline without replacement (2.4.7).
- Keep focused components from being entirely covered by sticky overlays (2.4.11 Focus Not Obscured, AA).
- Ensure pointer targets are at least **24×24 CSS px** or qualify for a WCAG 2.5.8 exception; **44×44 CSS px preferred**.
- The accessible name of a control should include its visible text (2.5.3 Label in Name).
- Avoid automatic focus jumps during stock updates, 409 rollback, live-feed updates or timer expiry.

### 8.3 Responsive content and motion

- Support **320 CSS px** reflow, 200% text resizing, 400% zoom and increased text spacing without hidden primary actions (1.4.10, 1.4.4, 1.4.12).
- Respect `prefers-reduced-motion` for scrolling, animated counters and transitions; respect forced-colors/high-contrast modes.
- Avoid unnecessary auto-scrolling and flashing. Provide pause/resume for any automatically updating content covered by 2.2.2.
- Time-limited interactions need a deliberate review of **2.2.1 Timing Adjustable**. A genuine fixed real-time event may be exempt in specific circumstances, but a classroom demo should offer test/reset/extension controls where feasible. Never claim an exception without justification.

### 8.4 Errors and status messages

- Use concise `role="status"` / `aria-live="polite"` for claim success, 409 and drop-phase transitions; use `role="alert"` only for urgent errors. Avoid duplicate or rapid announcements (4.1.3).
- Explain **what failed** (e.g., claim unavailable because another claimant took the last crate) and **what can be done** (e.g., refresh/retry). Apply 3.3.1 and 3.3.3 where relevant.
- If the flow acts like a binding financial transaction, supply a review/confirm/reverse mechanism as applicable under 3.3.4; the demo must state that **no real money is charged**.
- Loading and disabled states must still be intelligible to screen readers; avoid trapping focus by disabling the currently focused control without a plan.

### 8.5 Accessibility verification

For each interactive feature, use keyboard-only testing, Chrome accessibility tree and at least one screen reader when available; complement with axe/Lighthouse rather than relying on their scores alone. Document browser, viewport, date, observed output and remaining limitations.

Reference: [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) and [W3C Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/).

## 9. React 19, TypeScript and performance constraints

- Use function components and hooks; keep pure calculations in non-React modules.
- Follow Rules of Hooks; include correct effect dependencies; clean up every subscription/timer/network request.
- Do not solve a stale closure by suppressing `react-hooks/exhaustive-deps` or introducing unstable callbacks without a reason.
- Do not store values that can be derived from props/state unless there is a real source of truth or performance need.
- Use `useMemo`/`useCallback`/`React.memo` for measurable stability, not as blanket decorations. Verify with React DevTools Profiler.
- Do not use array indices as keys for mutable sorted/filtered lists; use stable drop/event/squad IDs.
- Avoid unsafe `any`, unexplained non-null assertions, `@ts-ignore`, unhandled promises and unsafe numeric conversions.
- Keep testable reducers pure, deterministic and immutable; avoid using `Date.now()` inside reducers when time can be passed explicitly.
- State updates after unmount, duplicate `visibilitychange` listeners and incomplete cleanup are blocking defects.
- Control network aborts and ignore late results after cancellation; log only non-sensitive structured debug information.

## 10. Required verification before marking a task complete

**Automated tests:**

- Use Vitest fake timers + stubbed `Date.now()`/system clock for anti-drift and background-throttle tests.
- Use controlled Promise resolution and mock responses for optimistic lock, duplicate request, 409, retry and stale network responses.
- Use React Testing Library/user-event where available for keyboard/visible-status integration.
- Include original Lab 2 HW3 behavioral guarantees in newly adapted tests; don't merely rename tests.
- Assert resource cleanup after unmount and rapid mount/unmount in React StrictMode.
- Test accessibility semantics and focus behavior in addition to snapshot/visual tests.

**Local commands (from `Homework_3/app`):**

```powershell
npm run test
npm run build
npm run lint
npm run dev
```

Do not invent or assume scripts exist; inspect `package.json` first and adapt commands if necessary.

**Manual Chrome / React DevTools:**

1. Open React DevTools **Profiler** and record a claim or filter action; verify unaffected rows are not repeatedly re-rendered.
2. Use Chrome DevTools to simulate background tab inactivity and test immediate timer resync on return.
3. Force simulated HTTP 409 and verify exact stock recovery and textual feedback.
4. Inspect Effects/subscriptions/console for stale timers or duplicate listeners after changing target and reset.
5. Test 320 CSS px/mobile, zoom, full keyboard workflow, live announcements and accessible fallback virtual list.
6. Save **real** screenshots in `Homework_3/evidence/` and cite the corresponding evidence files in README/audit.

## 11. Mandatory AI failure audit — 15% slide weight

Create `Homework_3/AI_FAILURE_AUDIT.md` with **at least three distinct, reproducible bugs actually produced or suggested by AI** during this assignment. The AI must help **discover, explain and fix** the failures, but must not fabricate failures, screenshots or successful retests.

### Required entry template

```markdown
## F-01 — <specific, factual title>

- **Status:** Detected / Fixed / Retested
- **Severity:** High / Medium / Low
- **Affected files:** `app/src/...`
- **AI-generated defect:** What code/assumption was wrong, with before-code excerpt.
- **Impact:** What user-visible or functional failure occurred.
- **Reproduction:** Exact inputs, steps, mocked time/network conditions.
- **DevTools/test evidence:** Actual screenshot/log/test file and observed result.
- **Root cause:** Explain the mechanism (not merely "AI hallucination").
- **Manual fix:** Edited code and why it solves the issue.
- **Regression verification:** Test command and real pass/fail result.
- **Commit:** Actual short hash and Conventional Commit message.
```

Potential **investigation targets** (not valid audit entries until reproduced): stale timer closure when offset changes; leaked visibility listener; naive `setInterval` drift; duplicate-click optimistic deduction; 409 rollback applied twice; race after unmount; inaccessible virtualized rows; duplicated derived state causing unnecessary renders.

At each relevant task, record the failure **before** fixing it, then add real failing and passing test evidence. The audit is mandatory even if the final app passes all tests. Three speculative risks are **not** three audited defects.

## 12. Git, security and submission rules

### Git

- The first commit for HW3 must include `task_decomposition.md` and `ai_rule.md`, before application implementation.
- Use scoped Conventional Commits per completed task: `docs(hw3)`, `chore(hw3)`, `feat(hw3)`, `fix(hw3)`, `test(hw3)`, `style(hw3)`, `refactor(hw3)`.
- Prefer **one commit per task** and additional focused `fix(hw3)` commits for real AI audit defects.
- Give commands relative to the user's working directory; check `git status` and `git remote -v` when unsure.
- Do not suggest `git push --force` or rewriting shared Git history as the default response to a rejected push.
- Never state that code is on GitHub until push and remote state are actually confirmed.
- Keep the new application under the **Lab 3 repository**; do not commit it into Lab 2.

### Security / authenticity

- No real payments, user credentials or unverified third-party APIs. Avoid leaking tokens, keys and `.env` files.
- Do not present simulated stock correctness as real simultaneous multi-client correctness.
- Do not impersonate KRAFTON, PUBG Vietnam, PVS organizers or official results. Label branding and all tournament data as an **educational, unofficial demo**.
- Use only images/fonts/assets the student has rights to; provide text/CSS substitutes where uncertain.

### Final delivery checklist

- [ ] `task_decomposition.md` and `ai_rule.md` present and accurate.
- [ ] Domain contract and all core features implemented.
- [ ] Anti-drift, visibility resync and 409 rollback regression tests passing.
- [ ] Accessible claim UI, leaderboard, kill-feed and virtual fallback verified.
- [ ] WCAG 2.2 AA target manually checked and remaining issues documented.
- [ ] `AI_FAILURE_AUDIT.md` contains ≥3 **proven** AI defects with before/after proof.
- [ ] `README.md` explains setup, testing, migration source and demo scope.
- [ ] React DevTools, tests and accessibility evidence use real captures.
- [ ] Scoped Git commits pushed to the correct Lab 3 GitHub remote.

**Operating instruction:** When the student asks for the next step, start with the next unchecked task from `task_decomposition.md`. Never mark an untested task or unobserved audit bug as complete.
