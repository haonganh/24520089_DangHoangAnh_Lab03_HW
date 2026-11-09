
import { describe, expect, it } from 'vitest';

import {
  claimReducer,
  createClaimState,
  getAvailableStock,
  getClaimStatus,
  getConfirmedCount,
} from './claim-machine';

import type { ClaimState } from './claim-machine';

const drops = [
  { id: 'vip-pass', remainingStock: 5 },
  { id: 'gcoin-crate', remainingStock: 10 },
];

function claim(
  state: ClaimState,
  claimId: string,
  dropId = 'vip-pass'
): ClaimState {
  return claimReducer(state, {
    type: 'CLAIM',
    claimId,
    dropId,
    now: 1000,
  });
}

describe('T07 - PUBG Optimistic Claim FSM', () => {
  it('initializes inventory correctly', () => {
    const state = createClaimState(drops);

    expect(getAvailableStock(state, 'vip-pass')).toBe(5);
    expect(getAvailableStock(state, 'gcoin-crate')).toBe(10);
    expect(state.version).toBe(0);
  });

  it('decrements stock optimistically', () => {
    let state = createClaimState(drops);

    state = claim(state, 'claim-1');

    expect(getAvailableStock(state, 'vip-pass')).toBe(4);
    expect(getClaimStatus(state, 'claim-1')).toBe('PENDING');
    expect(state.version).toBe(1);
  });

  it('prevents overselling with 20 requests', () => {
    let state = createClaimState(drops);

    let accepted = 0;
    let rejected = 0;

    for (let i = 1; i <= 20; i++) {
      try {
        state = claim(state, `customer-${i}`);
        accepted++;
      } catch {
        rejected++;
      }
    }

    expect(accepted).toBe(5);
    expect(rejected).toBe(15);
    expect(getAvailableStock(state, 'vip-pass')).toBe(0);
  });

  it('prevents duplicate claim IDs', () => {
    let state = createClaimState(drops);

    state = claim(state, 'claim-1');

    expect(() =>
      claim(state, 'claim-1')
    ).toThrow('Duplicate claim ID');

    expect(getAvailableStock(state, 'vip-pass')).toBe(4);
  });

  it('confirms successful claims', () => {
    let state = createClaimState(drops);

    state = claim(state, 'claim-1');

    state = claimReducer(state, {
      type: 'CONFIRM',
      claimId: 'claim-1',
    });

    expect(getClaimStatus(state, 'claim-1')).toBe('CONFIRMED');
    expect(getAvailableStock(state, 'vip-pass')).toBe(4);
    expect(getConfirmedCount(state, 'vip-pass')).toBe(1);
  });

  it('rolls back stock after HTTP 409', () => {
    let state = createClaimState(drops);

    state = claim(state, 'claim-1');

    expect(getAvailableStock(state, 'vip-pass')).toBe(4);

    state = claimReducer(state, {
      type: 'ROLLBACK',
      claimId: 'claim-1',
      reason: 'HTTP_409',
    });

    expect(getAvailableStock(state, 'vip-pass')).toBe(5);
    expect(getClaimStatus(state, 'claim-1')).toBe('ROLLED_BACK');
    expect(state.claims['claim-1'].rollbackReason).toBe('HTTP_409');
  });

  it('prevents double rollback', () => {
    let state = createClaimState(drops);

    state = claim(state, 'claim-1');

    state = claimReducer(state, {
      type: 'ROLLBACK',
      claimId: 'claim-1',
      reason: 'HTTP_409',
    });

    const previousVersion = state.version;

    const repeated = claimReducer(state, {
      type: 'ROLLBACK',
      claimId: 'claim-1',
      reason: 'HTTP_409',
    });

    expect(repeated).toBe(state);
    expect(repeated.version).toBe(previousVersion);
    expect(getAvailableStock(repeated, 'vip-pass')).toBe(5);
  });

  it('prevents rollback after confirmation', () => {
    let state = createClaimState(drops);

    state = claim(state, 'claim-1');

    state = claimReducer(state, {
      type: 'CONFIRM',
      claimId: 'claim-1',
    });

    expect(() =>
      claimReducer(state, {
        type: 'ROLLBACK',
        claimId: 'claim-1',
        reason: 'HTTP_409',
      })
    ).toThrow('Invalid transition');

    expect(getAvailableStock(state, 'vip-pass')).toBe(4);
  });

  it('maintains separate inventory for each drop', () => {
    let state = createClaimState(drops);

    state = claim(state, 'claim-1', 'vip-pass');
    state = claim(state, 'claim-2', 'gcoin-crate');

    expect(getAvailableStock(state, 'vip-pass')).toBe(4);
    expect(getAvailableStock(state, 'gcoin-crate')).toBe(9);

    state = claimReducer(state, {
      type: 'ROLLBACK',
      claimId: 'claim-2',
      reason: 'NETWORK_ERROR',
    });

    expect(getAvailableStock(state, 'vip-pass')).toBe(4);
    expect(getAvailableStock(state, 'gcoin-crate')).toBe(10);
  });

  it('rejects invalid stock and unknown drops', () => {
    expect(() =>
      createClaimState([
        { id: 'invalid', remainingStock: -1 },
      ])
    ).toThrow();

    const state = createClaimState(drops);

    expect(() =>
      claim(state, 'claim-1', 'unknown')
    ).toThrow('Drop not found');
  });

  it('preserves immutable previous state', () => {
    const original = createClaimState(drops);

    const updated = claim(original, 'claim-1');

    expect(getAvailableStock(original, 'vip-pass')).toBe(5);
    expect(getAvailableStock(updated, 'vip-pass')).toBe(4);

    expect(original.claims['claim-1']).toBeUndefined();
    expect(updated.claims['claim-1']).toBeDefined();
  });

  it('allows retry with a new claim ID', () => {
    let state = createClaimState(drops);

    state = claim(state, 'claim-1');

    state = claimReducer(state, {
      type: 'ROLLBACK',
      claimId: 'claim-1',
      reason: 'HTTP_409',
    });

    state = claim(state, 'claim-2');

    expect(getClaimStatus(state, 'claim-1')).toBe('ROLLED_BACK');
    expect(getClaimStatus(state, 'claim-2')).toBe('PENDING');
    expect(getAvailableStock(state, 'vip-pass')).toBe(4);
  });
});
