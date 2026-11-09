
import type { PubgCrateDrop } from '../domain/pubg-vn-arena-contract';
import { formatVnd } from '../demo/demoFixtures';
import { usePubgAirdropTimer } from '../hooks/usePubgAirdropTimer';

interface Props {
  drop: PubgCrateDrop;
  serverOffsetMs?: number;
}

export function AirdropCountdown({
  drop,
  serverOffsetMs = 0,
}: Props) {
  const { formattedTime, isExpired } =
    usePubgAirdropTimer(
      drop.dropEpochMs,
      serverOffsetMs
    );

  const headingId = `heading-${drop.id}`;

  return (
    <article aria-labelledby={headingId}>
      <h3 id={headingId}>{drop.title}</h3>

      <p>Price: {formatVnd(drop.priceVnd)}</p>

      <p>Available stock: {drop.remainingStock}</p>

      <p>
        Time remaining:{' '}
        <output
          role="timer"
          aria-live="off"
          aria-label={`Countdown for ${drop.title}`}
        >
          {formattedTime}
        </output>
      </p>

      <p role="status" aria-live="polite">
        {isExpired
          ? 'Airdrop countdown finished.'
          : 'Airdrop countdown active.'}
      </p>
    </article>
  );
}
