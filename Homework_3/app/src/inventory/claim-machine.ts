
import type { PubgCrateDrop } from '../domain/pubg-vn-arena-contract';

export type ClaimStatus =
  | 'IDLE'
  | 'PENDING'
  | 'CONFIRMED'
  | 'ROLLED_BACK';

export type RollbackReason =
  | 'HTTP_409'
  | 'NETWORK_ERROR'
  | 'CANCELLED';

export interface ClaimRecord {
  readonly claimId: string;
  readonly dropId: string;
  readonly status: Exclude<ClaimStatus, 'IDLE'>;
  readonly createdAt: number;
  readonly rollbackReason?: RollbackReason;
}

export interface ClaimState {
  readonly availableByDrop: Readonly<Record<string, number>>;
  readonly claims: Readonly<Record<string, ClaimRecord>>;
  readonly version: number;
}

export type ClaimAction =
  | {
      type: 'CLAIM';
      claimId: string;
      dropId: string;
      now: number;
    }
  | {
      type: 'CONFIRM';
      claimId: string;
    }
  | {
      type: 'ROLLBACK';
      claimId: string;
      reason: RollbackReason;
    };

// Adapted from Lab 2 HW3 inventory-machine.ts.
export function createClaimState(
  drops: readonly Pick<
    PubgCrateDrop,
    'id' | 'remainingStock'
  >[]
): ClaimState {
  const availableByDrop: Record<string, number> =
    Object.create(null) as Record<string, number>;

  for (const drop of drops) {
    const id = drop.id.trim();

    if (!id) {
      throw new Error('Drop ID cannot be empty');
    }

    if (Object.hasOwn(availableByDrop, id)) {
      throw new Error('Duplicate drop ID');
    }

    if (
      !Number.isSafeInteger(drop.remainingStock) ||
      drop.remainingStock < 0
    ) {
      throw new Error('Invalid initial stock');
    }

    availableByDrop[id] = drop.remainingStock;
  }

  return {
    availableByDrop,
    claims: Object.create(null) as Record<
      string,
      ClaimRecord
    >,
    version: 0,
  };
}

export function getAvailableStock(
  state: ClaimState,
  dropId: string
): number {
  const stock = state.availableByDrop[dropId];

  if (stock === undefined) {
    throw new Error('Drop not found');
  }

  return stock;
}

export function getClaimStatus(
  state: ClaimState,
  claimId: string
): ClaimStatus {
  return state.claims[claimId]?.status ?? 'IDLE';
}

export function getConfirmedCount(
  state: ClaimState,
  dropId: string
): number {
  return Object.values(state.claims).filter(
    (claim) =>
      claim.dropId === dropId &&
      claim.status === 'CONFIRMED'
  ).length;
}

export function claimReducer(
  state: ClaimState,
  action: ClaimAction
): ClaimState {
  const claimId = action.claimId.trim();

  if (!claimId) {
    throw new Error('Claim ID cannot be empty');
  }

  // T07: Optimistic inventory lock.
  if (action.type === 'CLAIM') {
    if (!Number.isFinite(action.now)) {
      throw new Error('Invalid claim timestamp');
    }

    const dropId = action.dropId.trim();

    if (!dropId) {
      throw new Error('Drop ID cannot be empty');
    }

    if (state.claims[claimId]) {
      throw new Error('Duplicate claim ID');
    }

    const stock = getAvailableStock(state, dropId);

    if (stock <= 0) {
      throw new Error('OUT_OF_STOCK');
    }

    const claim: ClaimRecord = {
      claimId,
      dropId,
      status: 'PENDING',
      createdAt: action.now,
    };

    return {
      ...state,
      availableByDrop: {
        ...state.availableByDrop,
        [dropId]: stock - 1,
      },
      claims: {
        ...state.claims,
        [claimId]: claim,
      },
      version: state.version + 1,
    };
  }

  const claim = state.claims[claimId];

  if (!claim) {
    throw new Error('Claim not found');
  }

  // T07: Successful claim settlement.
  if (action.type === 'CONFIRM') {
    // Duplicate confirmation is idempotent.
    if (claim.status === 'CONFIRMED') {
      return state;
    }

    if (claim.status !== 'PENDING') {
      throw new Error('Invalid transition to CONFIRMED');
    }

    return {
      ...state,
      claims: {
        ...state.claims,
        [claimId]: {
          ...claim,
          status: 'CONFIRMED',
        },
      },
      version: state.version + 1,
    };
  }

  // T07: HTTP 409 / network error rollback.
  if (action.type === 'ROLLBACK') {
    // Prevent double rollback and double stock restoration.
    if (claim.status === 'ROLLED_BACK') {
      return state;
    }

    if (claim.status !== 'PENDING') {
      throw new Error('Invalid transition to ROLLED_BACK');
    }

    const stock = getAvailableStock(
      state,
      claim.dropId
    );

    return {
      ...state,
      availableByDrop: {
        ...state.availableByDrop,
        [claim.dropId]: stock + 1,
      },
      claims: {
        ...state.claims,
        [claimId]: {
          ...claim,
          status: 'ROLLED_BACK',
          rollbackReason: action.reason,
        },
      },
      version: state.version + 1,
    };
  }

  return state;
}
