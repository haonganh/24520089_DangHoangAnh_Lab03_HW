
import type {
  ClaimAction,
  RollbackReason,
} from '../inventory/claim-machine';

import {
  ClaimApiError,
} from './mock-claim-api';

import type {
  ClaimRequest,
  MockClaimApi,
} from './mock-claim-api';

export type ClaimOutcome =
  | 'CONFIRMED'
  | 'ROLLED_BACK';

function getRollbackReason(
  error: unknown
): RollbackReason {
  if (
    error instanceof ClaimApiError &&
    error.status === 409
  ) {
    return 'HTTP_409';
  }

  if (
    error instanceof DOMException &&
    error.name === 'AbortError'
  ) {
    return 'CANCELLED';
  }

  return 'NETWORK_ERROR';
}

/**
 * T08 - Optimistic claim orchestration.
 *
 * The caller must ensure the claim is valid
 * before invoking this function.
 */
export async function executeOptimisticClaim(
  api: MockClaimApi,
  request: ClaimRequest,
  dispatch: (action: ClaimAction) => void,
  now = Date.now()
): Promise<ClaimOutcome> {
  // Optimistic update: reduce local stock immediately.
  dispatch({
    type: 'CLAIM',
    claimId: request.claimId,
    dropId: request.dropId,
    now,
  });

  try {
    await api.claim(request);

    if (request.signal?.aborted) {
      throw new DOMException(
        'Claim cancelled',
        'AbortError'
      );
    }

    dispatch({
      type: 'CONFIRM',
      claimId: request.claimId,
    });

    return 'CONFIRMED';
  } catch (error) {
    dispatch({
      type: 'ROLLBACK',
      claimId: request.claimId,
      reason: getRollbackReason(error),
    });

    return 'ROLLED_BACK';
  }
}
