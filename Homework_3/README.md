# Lab 3 – Homework 3: PUBG Vietnam Airdrop Arena

## Overview

An **unofficial educational demo** built with React, TypeScript, and Vite. It combines an anti-drift airdrop countdown, optimistic inventory claims, a simulated PUBG Vietnam leaderboard, a filterable kill feed, and a virtualized event list. This project is **not affiliated with or endorsed by KRAFTON or PUBG**. Teams, scores, prices, stock levels, and combat events are illustrative demo data, not official results or real offers.

**Accessibility target:** WCAG 2.2 Level AA. This is a development target, **not a certification of conformance**.

## Requirements and setup

Install a Node.js version supported by the installed Vite release and use npm. From the Lab 3 repository root:

```bash
cd Homework_3/app
npm install
npm run dev
```

Open the local URL shown by Vite (usually `http://localhost:5173/`).

## Features

| Module | Functionality |
| --- | --- |
| Anti-drift clock | Absolute-deadline countdown using `Date.now()`, optional server offset, and visibility/focus resynchronization. |
| Airdrop phases | `WARMUP`, `AIRDROP_LIVE`, `LOOTED_OUT`, and `EXPIRED`. |
| Optimistic claim | Immediate stock reservation; confirmation or rollback on simulated HTTP 409, cancellation, or network failure. |
| Mock claim API | Local in-memory server stock, duplicate-request protection, and `AbortController` cancellation. |
| Leaderboard | WWCD, placement points, kill points, total points, search, and sorting. |
| Kill feed | Simulated KILL/KNOCK events, player/weapon search, and squad/type filters. |
| Virtual scrolling | Fixed-size visible window for large event lists with a **Show all events** fallback. |

### Try the demo

1. Select **Activate live demo** to enable claims without waiting for the countdown.
2. Select **Claim item** to observe an optimistic stock decrement and eventual confirmation.
3. Select **Simulate HTTP 409** to observe a temporary decrement followed by stock rollback.
4. Search or sort the leaderboard; filter the kill feed.
5. Select **Load 1,000 test events** and scroll the event list. Use **Show all events** to access the complete list.

## Lab 2 reuse

The implementation adapts concepts from **Lab 2 – Homework 3** rather than copying the whole application:

- `timer/anti-drift-timer.ts` → absolute-epoch calculations in `timer/airdrop-clock.ts` and the `usePubgAirdropTimer` hook.
- `inventory/inventory-machine.ts` → inventory transition and rollback principles in `inventory/claim-machine.ts`.
- Lab 2 timer/inventory unit-test patterns → regression tests for deadlines, stock limits, duplicate claims, and rollback.

The Lab 2 repository is kept separate and unchanged.

## Main source structure

```text
Homework_3/
├── ai_rule.md
├── task_decomposition.md
├── lab2_migration_notes.md
├── ai_failure.md
├── evidence/                 # Screenshots collected during verification
├── README.md
└── app/
    ├── src/
    │   ├── domain/
    │   ├── demo/
    │   ├── timer/
    │   ├── hooks/
    │   ├── airdrop/
    │   ├── inventory/
    │   ├── api/
    │   ├── leaderboard/
    │   ├── killfeed/
    │   ├── virtualization/
    │   ├── components/
    │   ├── App.tsx
    │   └── App.integration.test.tsx
    └── package.json
```

## Verification

From `Homework_3/app`:

```bash
npm run test
npm run build
npm run lint
npm run dev
```

Automated tests cover timer calculations, visibility resync, airdrop phases, inventory state transitions, mock API behavior, leaderboard ordering, kill-feed filters, virtual-window calculations, and UI integration. **Record the actual output** rather than assuming all tests pass.

For manual verification, check keyboard-only navigation, visible focus, the skip link, claim status announcements, desktop/mobile layout, 200%/400% zoom, text contrast, and screen reader behavior. Run Lighthouse or axe as supporting tools, but note that their scores alone do not prove WCAG 2.2 AA compliance. Test virtual scrolling at high zoom; the fixed-height rows may need additional work if content is clipped.

Use **React DevTools Profiler** to check rendering while claiming, sorting, filtering, and scrolling. Record screenshots and measurements in `evidence/`.

## AI-assisted development and audit

`ai_rule.md` contains the rules used when working with AI, `task_decomposition.md` records incremental tasks and commits, and `ai_failure.md` records **three issues observed during development**, their causes, repairs, and evidence requirements. Do not mark uncollected screenshots or unrun audits as complete.

## Limitations

- Claims, server inventory, and combat events are simulated locally and are not persistent or connected to real PUBG services.
- The virtual scroller uses fixed row heights; verify text reflow and screen reader accessibility, especially at 400% zoom.
- Browser audio, genuine PUBG inventory, payment processing, authentication, and official rankings are outside this assignment's scope.
