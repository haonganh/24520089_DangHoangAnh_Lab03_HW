
import type { PubgCrateDrop } from '../domain/pubg-vn-arena-contract';

export interface ClaimRequest {
  claimId: string;
  dropId: string;
  signal?: AbortSignal;
  simulateHttp409?: boolean;
}

export interface ClaimReceipt {
  claimId: string;
  dropId: string;
  status: 'CONFIRMED';
  remainingStock: number;
}


export class ClaimApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ClaimApiError';
    this.status = status;
  }
}


function abortError(): DOMException {
  return new DOMException('Claim cancelled', 'AbortError');
}

function delay(
  ms: number,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }

    const cleanup = () => {
      signal?.removeEventListener('abort', onAbort);
    };

    const onAbort = () => {
      clearTimeout(timer);
      cleanup();
      reject(abortError());
    };

    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    signal?.addEventListener('abort', onAbort, {
      once: true,
    });
  });
}

export function createMockClaimApi(
  drops: readonly Pick<
    PubgCrateDrop,
    'id' | 'remainingStock'
  >[],
  latencyMs = 400
) {
  if (!Number.isFinite(latencyMs) || latencyMs < 0) {
    throw new RangeError('Invalid API latency');
  }

  const stock = new Map<string, number>();
  const receipts = new Map<string, ClaimReceipt>();

  for (const drop of drops) {
    if (
      !drop.id.trim() ||
      stock.has(drop.id) ||
      !Number.isSafeInteger(drop.remainingStock) ||
      drop.remainingStock < 0
    ) {
      throw new Error('Invalid initial server inventory');
    }

    stock.set(drop.id, drop.remainingStock);
  }

  return {
    async claim(request: ClaimRequest): Promise<ClaimReceipt> {
      const claimId = request.claimId.trim();
      const dropId = request.dropId.trim();

      if (!claimId || !dropId) {
        throw new Error('Invalid claim request');
      }

      if (!stock.has(dropId)) {
        throw new ClaimApiError(404, 'Drop not found');
      }

      await delay(latencyMs, request.signal);

      if (request.signal?.aborted) {
        throw abortError();
      }

      // Repeated request IDs must not reduce stock twice.
      const previous = receipts.get(claimId);

      if (previous) {
        if (previous.dropId !== dropId) {
          throw new ClaimApiError(
            409,
            'Claim ID already used for another drop'
          );
        }

        return previous;
      }

      const available = stock.get(dropId)!;

      // Simulate a competing user claiming the last item.
      if (request.simulateHttp409 || available === 0) {
        throw new ClaimApiError(
          409,
          'Conflict: item no longer available'
        );
      }

      stock.set(dropId, available - 1);

      const receipt: ClaimReceipt = {
        claimId,
        dropId,
        status: 'CONFIRMED',
        remainingStock: available - 1,
      };

      receipts.set(claimId, receipt);

      return receipt;
    },

    getServerStock(dropId: string): number {
      const available = stock.get(dropId);

      if (available === undefined) {
        throw new Error('Drop not found');
      }

      return available;
    },
  };
}

export type MockClaimApi = ReturnType<
  typeof createMockClaimApi
>;
