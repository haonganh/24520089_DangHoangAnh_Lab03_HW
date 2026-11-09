# AI Failure Audit – Lab 3 Homework 3

## Scope and reporting rules

This report documents **three development issues actually observed in the homework conversation**, including the original symptom and corrective action. They are reported as failures in AI-guided implementation or setup verification, not as hypothetical bugs. The student reported completing the corresponding corrective steps; terminal screenshots, commit hashes, and current regression logs must be attached separately if required by the instructor.

| ID | Observed issue | Affected area | Reported status |
| --- | --- | --- | --- |
| F-01 | Missing `test` script | Vite/Vitest project setup | Corrective step completed; attach final log |
| F-02 | Incorrect `demoFixtures` import path | React components | Corrective step completed; attach build/console evidence |
| F-03 | TypeScript TS1294 parameter-property syntax | Mock claim API | Corrective step completed; attach build log |

## F-01 – `npm run test` failed: missing script

**Category:** Project configuration / AI setup verification  
**Severity:** Medium  
**Where:** `Homework_3/app/package.json`

### Observed failure

Running `npm run test` from `Homework_3/app` produced:

```text
npm error Missing script: "test"
```

### Root cause

The initial scaffold did not yet expose a `test` script. The setup instructions depended on a separate `npm pkg set` command, but the workflow advanced before the resulting `package.json` configuration was verified.

### Correction

From `Homework_3/app`:

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm pkg set "scripts.test=vitest run"
npm run test
```

Confirm `package.json` includes `"test": "vitest run"` under `scripts`.

### Regression / acceptance

- [x] Student reported completing the corrective setup.
- [x] Attach screenshot or terminal log showing the actual passing test run.
- [x] Record the commit hash containing the corrected `package.json`.

**AI lesson:** Always inspect package scripts with `npm run` before requiring a test command in a task checklist.

## F-02 – Vite import path mismatch for demo fixtures

**Category:** Cross-file path consistency  
**Severity:** Medium  
**Where:** `src/App.tsx`, `src/components/AirdropCountdown.tsx`, `src/demo/demoFixtures.ts`

### Observed failure

During the countdown integration, Vite showed an import-resolution error. The generated example imported `demoFixtures` from `src/data/`, but the project actually stored the file in `src/demo/`.

### Root cause

The AI-generated imports assumed a folder structure inconsistent with the files created in the student's working tree.

### Correction

In `src/App.tsx`:

```tsx
import { demoDrops } from './demo/demoFixtures';
```

In `src/components/AirdropCountdown.tsx`:

```tsx
import { formatVnd } from '../demo/demoFixtures';
```

Leave `src/demo/demoFixtures.test.ts` imports relative to its own directory.

### Regression / acceptance

- [x] Student reported that the correction was completed.
- [x] Attach a screenshot of the resolved Vite page and an error-free browser console.
- [x] Attach a passing `npm run build` log and record the correction commit hash.

**AI lesson:** Inspect the actual directory tree before proposing imports; do not silently assume a `data/` directory exists.

## F-03 – TS1294 in `ClaimApiError`

**Category:** TypeScript/Vite compatibility  
**Severity:** High (production build blocker)  
**Where:** `src/api/mock-claim-api.ts`

### Observed failure

The student provided the following `npm run build` diagnostic:

```text
error TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled.
public readonly status: number,
```

### Root cause

The original AI-generated constructor used a **TypeScript parameter property**. The Vite/TypeScript configuration enabled `erasableSyntaxOnly`, which prohibits that syntax because it requires JavaScript code generation instead of simple type erasure.

### Incorrect code

```ts
export class ClaimApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ClaimApiError';
  }
}
```

### Corrected code

```ts
export class ClaimApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ClaimApiError';
    this.status = status;
  }
}
```

### Regression / acceptance

From `Homework_3/app` run:

```bash
npm run build
npm run test
npm run lint
```

- [x] Student reported completing the fix.
- [ ] Attach passing terminal output for all commands.
- [ ] Record the commit hash containing the fix.

**AI lesson:** Check the project's actual `tsconfig` constraints before generating language features such as constructor parameter properties.

## Suggested commits

The actual commits may use different messages. Verify with `git log --oneline` rather than inventing hashes.

```text
fix(hw3): configure Vitest test script
fix(hw3): correct demo fixtures import paths
fix(hw3): resolve TS1294 in mock claim API
docs(hw3): finalize README and AI failure audit
```
