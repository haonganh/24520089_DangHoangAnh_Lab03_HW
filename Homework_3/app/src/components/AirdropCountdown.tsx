
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
}: Props) {
  const {
    formattedTime,
    nowEpochMs,
  } = usePubgAirdropTimer(
    drop.dropEpochMs,
    serverOffsetMs
  );

  const phase = getDropPhase(
    drop,
    nowEpochMs,
    serverOffsetMs
  );

  const headingId = `heading-${drop.id}`;

  return (
    <article aria-labelledby={headingId}>
      <h3 id={headingId}>{drop.title}</h3>

      <p>Price: {formatVnd(drop.priceVnd)}</p>

      <p>Available stock: {drop.remainingStock}</p>

      <p role="status" aria-live="polite">
        Status: {phaseLabels[phase]}
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
        <p>
          The airdrop is now available for claiming.
        </p>
      )}

      {phase === 'LOOTED_OUT' && (
        <p>All available items have been claimed.</p>
      )}

      {phase === 'EXPIRED' && (
        <p>This airdrop has ended.</p>
      )}
    </article>
  );
}
