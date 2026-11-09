# Lab 2 to Lab 3 – HW3 Migration Notes

## 1. Source Modules

| Lab 2 HW3 Module | Reuse in Lab 3 HW3 |
|---|---|
| `timer/anti-drift-timer.ts` | Absolute-epoch countdown |
| `timer/anti-drift-timer.test.ts` | Timer regression tests |
| `inventory/inventory-machine.ts` | Optimistic claim state machine |
| `inventory/inventory-machine.test.ts` | Stock and concurrency tests |

## 2. Timer Migration

**Original implementation:**
- Uses `Date.now()` to prevent countdown drift.
- Uses `requestAnimationFrame()` for updates.
- Provides a cleanup function.

**Required changes:**
- Accept `targetEpochMs` instead of a relative duration.
- Support `serverOffsetMs`.
- Create `usePubgAirdropTimer`.
- Resynchronize on `visibilitychange`.
- Clean up scheduled callbacks when unmounted.

## 3. Inventory Migration

**Original implementation:**
- Validates nonnegative integer stock.
- Rejects duplicate reservation IDs.
- Enforces legal reservation transitions.
- Supports reservation cancellation and expiration.

**Required changes:**
- Support multiple PUBG airdrops.
- Implement optimistic G-Coin crate and ticket claims.
- Simulate HTTP 409 Conflict responses.
- Restore stock after failed claims.
- Prevent duplicate settlement and negative stock.

## 4. Testing Strategy

Reuse and adapt Lab 2 test scenarios for:

- Timer accuracy after delayed callbacks.
- Timer cancellation and cleanup.
- Stock exhaustion.
- Duplicate reservations.
- Concurrent claims.
- Successful confirmation.
- HTTP 409 rollback.

## 5. Migration Rules

- Do not modify the original Lab 2 repository.
- Do not copy the entire Lab 2 application.
- Adapt reusable logic to the Lab 3 domain.
- Preserve TypeScript type safety.
- Follow WCAG 2.2 Level AA.
- Run tests after every implementation task.
