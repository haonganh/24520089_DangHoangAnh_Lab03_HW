
export type KillEventType = 'KILL' | 'KNOCK';

export interface KillFeedEvent {
  readonly id: string;
  readonly killer: string;
  readonly victim: string;
  readonly squadId: string;
  readonly weapon: string;
  readonly type: KillEventType;
  readonly timestamp: number;
}

const baseTime = Date.now();

export const demoKillEvents: readonly KillFeedEvent[] = [
  {
    id: 'event-1',
    killer: 'TEX_Player1',
    victim: 'CES_Player2',
    squadId: 'the-expendables',
    weapon: 'Beryl M762',
    type: 'KILL',
    timestamp: baseTime - 60_000,
  },
  {
    id: 'event-2',
    killer: 'CES_Player1',
    victim: 'ROY_Player3',
    squadId: 'cerberus-esports',
    weapon: 'M416',
    type: 'KNOCK',
    timestamp: baseTime - 45_000,
  },
  {
    id: 'event-3',
    killer: 'ROY_Player2',
    victim: 'AGG_Player1',
    squadId: 'roy-esports',
    weapon: 'Mini14',
    type: 'KILL',
    timestamp: baseTime - 30_000,
  },
  {
    id: 'event-4',
    killer: 'AGG_Player3',
    victim: 'TEX_Player4',
    squadId: 'agg',
    weapon: 'AKM',
    type: 'KILL',
    timestamp: baseTime - 15_000,
  },
];

export interface KillFeedFilters {
  query: string;
  squadId: string;
  type: 'ALL' | KillEventType;
}

export function filterKillEvents(
  events: readonly KillFeedEvent[],
  filters: KillFeedFilters
): KillFeedEvent[] {
  const query = filters.query.trim().toLowerCase();

  return events
    .filter((event) => {
      const matchesSquad =
        filters.squadId === 'ALL' ||
        event.squadId === filters.squadId;

      const matchesType =
        filters.type === 'ALL' ||
        event.type === filters.type;

      const searchableText = [
        event.killer,
        event.victim,
        event.weapon,
      ].join(' ').toLowerCase();

      return (
        matchesSquad &&
        matchesType &&
        searchableText.includes(query)
      );
    })
    .sort((a, b) =>
      b.timestamp - a.timestamp ||
      a.id.localeCompare(b.id)
    );
}

export function formatEventTime(
  timestamp: number
): string {
  if (!Number.isFinite(timestamp)) {
    throw new RangeError('Invalid event timestamp');
  }

  return new Date(timestamp).toLocaleTimeString(
    'vi-VN',
    {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }
  );
}
