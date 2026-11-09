
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  claimReducer,
  createClaimState,
  getAvailableStock,
  getClaimStatus,
} from '../inventory/claim-machine';

import type {
  ClaimAction,
  ClaimState,
} from '../inventory/claim-machine';

import {
  ClaimApiError,
  createMockClaimApi,
} from './mock-claim-api';

import {
  executeOptimisticClaim,
} from './optimistic-claim';

const drops = [
  { id: 'vip-pass', remainingStock: 2 },
];

function createTestStore() {
  let state: ClaimState = createClaimState(drops);

  return {
    dispatch(action: ClaimAction) {
      state = claimReducer(state, action);
    },
    getState() {
      return state;
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('T08 - Optimistic Claim API', () => {
  it('confirms a successful claim', async () => {
    vi.useFakeTimers();

    const store = createTestStore();
    const api = createMockClaimApi(drops, 400);

    const task = executeOptimisticClaim(
      api,
      {
        claimId: 'c1',
        dropId: 'vip-pass',
      },
      store.dispatch
    );

    // Stock decreases immediately.
    expect(
      getAvailableStock(store.getState(), 'vip-pass')
    ).toBe(1);

    expect(
      getClaimStatus(store.getState(), 'c1')
    ).toBe('PENDING');

    await vi.advanceTimersByTimeAsync(400);

    expect(await task).toBe('CONFIRMED');

    expect(
      getClaimStatus(store.getState(), 'c1')
    ).toBe('CONFIRMED');

    expect(api.getServerStock('vip-pass')).toBe(1);
  });

  it('rolls back after HTTP 409', async () => {
    vi.useFakeTimers();

    const store = createTestStore();
    const api = createMockClaimApi(drops, 400);

    const task = executeOptimisticClaim(
      api,
      {
        claimId: 'c2',
        dropId: 'vip-pass',
        simulateHttp409: true,
      },
      store.dispatch
    );

    expect(
      getAvailableStock(store.getState(), 'vip-pass')
    ).toBe(1);

    await vi.advanceTimersByTimeAsync(400);

    expect(await task).toBe('ROLLED_BACK');

    expect(
      getAvailableStock(store.getState(), 'vip-pass')
    ).toBe(2);

    expect(
      getClaimStatus(store.getState(), 'c2')
    ).toBe('ROLLED_BACK');

    expect(
      store.getState().claims['c2'].rollbackReason
    ).toBe('HTTP_409');
  });

  it('rolls back when request is aborted', async () => {
    vi.useFakeTimers();

    const store = createTestStore();
    const api = createMockClaimApi(drops, 400);
    const controller = new AbortController();

    const task = executeOptimisticClaim(
      api,
      {
        claimId: 'c3',
        dropId: 'vip-pass',
        signal: controller.signal,
      },
      store.dispatch
    );

    controller.abort();

    expect(await task).toBe('ROLLED_BACK');

    expect(
      getAvailableStock(store.getState(), 'vip-pass')
    ).toBe(2);

    expect(
      store.getState().claims['c3'].rollbackReason
    ).toBe('CANCELLED');
  });

  it('rejects claims when server stock is exhausted', async () => {
    vi.useFakeTimers();

    const api = createMockClaimApi(
      [{ id: 'vip-pass', remainingStock: 1 }],
      100
    );

    const first = api.claim({
      claimId: 'first',
      dropId: 'vip-pass',
    });

    await vi.advanceTimersByTimeAsync(100);
    await first;

    const second = api.claim({
      claimId: 'second',
      dropId: 'vip-pass',
    });

    const assertion = expect(second).rejects.toMatchObject({
      status: 409,
    });

    await vi.advanceTimersByTimeAsync(100);
    await assertion;

    expect(api.getServerStock('vip-pass')).toBe(0);
  });

  it('does not reduce server stock twice for duplicate requests', async () => {
    vi.useFakeTimers();

    const api = createMockClaimApi(drops, 100);

    const first = api.claim({
      claimId: 'same-id',
      dropId: 'vip-pass',
    });

    await vi.advanceTimersByTimeAsync(100);
    const firstResult = await first;

    const duplicate = api.claim({
      claimId: 'same-id',
      dropId: 'vip-pass',
    });

    await vi.advanceTimersByTimeAsync(100);
    const duplicateResult = await duplicate;

    expect(duplicateResult).toEqual(firstResult);
    expect(api.getServerStock('vip-pass')).toBe(1);
  });

  it('provides an HTTP 409 error type', () => {
    const error = new ClaimApiError(
      409,
      'Conflict'
    );

    expect(error.status).toBe(409);
    expect(error.name).toBe('ClaimApiError');
  });
});
