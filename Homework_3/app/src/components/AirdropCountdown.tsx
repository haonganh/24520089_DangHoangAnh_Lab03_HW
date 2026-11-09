
import type {
  DropPhase,
  PubgCrateDrop,
} from '../domain/pubg-vn-arena-contract';

import { formatVnd } from '../demo/demoFixtures';
import { usePubgAirdropTimer } from '../hooks/usePubgAirdropTimer';

import {
  canClaimDrop,
  getDropPhase,
} from '../airdrop/airdrop-phase-machine';

interface Props {
  drop: PubgCrateDrop;
  serverOffsetMs?: number;
  isPending: boolean;
  message: string;
  onClaim: (dropId: string, simulate409: boolean) => void;
}

const phaseLabels: Record<DropPhase, string> = {
  WARMUP: 'Coming soon',
  AIRDROP_LIVE: 'Airdrop is live',
  LOOTED_OUT: 'Sold out',
  EXPIRED: 'Airdrop expired',
};

export function AirdropCountdown({
  drop,
  serverOffsetMs = 0,
  isPending,
  message,
  onClaim,
}: Props) {
  const { formattedTime, nowEpochMs } =
    usePubgAirdropTimer(
      drop.dropEpochMs,
      serverOffsetMs
    );

  const phase = getDropPhase(
    drop,
    nowEpochMs,
    serverOffsetMs
  );

  const headingId = `heading-${drop.id}`;
  const statusId = `claim-status-${drop.id}`;

  return (
    <article
      className="drop-card"
      aria-labelledby={headingId}
    >
      <h3 id={headingId}>{drop.title}</h3>

      <p>
        Price: <strong>{formatVnd(drop.priceVnd)}</strong>
      </p>

      <p>
        Available stock:{' '}
        <strong>{drop.remainingStock}</strong>
      </p>

      <p>
        Status: <strong>{phaseLabels[phase]}</strong>
      </p>

      {phase === 'WARMUP' && (
        <p>
          Airdrop opens in:{' '}
          <output
            role="timer"
            aria-live="off"
            aria-label={`Countdown for ${drop.title}`}
          >
            {formattedTime}
          </output>
        </p>
      )}

      {canClaimDrop(phase) && (
        <div className="claim-actions">
          <button
            type="button"
            disabled={isPending}
            aria-describedby={statusId}
            onClick={() => onClaim(drop.id, false)}
          >
            {isPending ? 'Processing...' : 'Claim item'}
          </button>

          <button
            type="button"
            className="secondary-button"
            disabled={isPending}
            aria-describedby={statusId}
            onClick={() => onClaim(drop.id, true)}
          >
            Simulate HTTP 409
          </button>
        </div>
      )}

      {phase === 'LOOTED_OUT' && (
        <p>All available items have been claimed.</p>
      )}

      {phase === 'EXPIRED' && (
        <p>This airdrop has ended.</p>
      )}

      <p
        id={statusId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {message}
      </p>
    </article>
  );
}
