
import { describe, expect, it } from 'vitest';

import {
  demoKillEvents,
  filterKillEvents,
  formatEventTime,
} from './kill-feed';

describe('T11 - PUBG Kill Feed', () => {
  const defaultFilters = {
    query: '',
    squadId: 'ALL',
    type: 'ALL' as const,
  };

  it('contains four demo events', () => {
    expect(demoKillEvents).toHaveLength(4);
  });

  it('sorts newest events first', () => {
    const result = filterKillEvents(
      demoKillEvents,
      defaultFilters
    );

    expect(result[0].id).toBe('event-4');
    expect(result[3].id).toBe('event-1');
  });

  it('filters by squad', () => {
    const result = filterKillEvents(
      demoKillEvents,
      {
        ...defaultFilters,
        squadId: 'cerberus-esports',
      }
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('event-2');
  });

  it('filters by kill events', () => {
    const result = filterKillEvents(
      demoKillEvents,
      {
        ...defaultFilters,
        type: 'KILL',
      }
    );

    expect(result).toHaveLength(3);
  });

  it('filters by knock events', () => {
    const result = filterKillEvents(
      demoKillEvents,
      {
        ...defaultFilters,
        type: 'KNOCK',
      }
    );

    expect(result).toHaveLength(1);
  });

  it('searches player names case-insensitively', () => {
    const result = filterKillEvents(
      demoKillEvents,
      {
        ...defaultFilters,
        query: 'tex_player1',
      }
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('event-1');
  });

  it('searches weapon names', () => {
    const result = filterKillEvents(
      demoKillEvents,
      {
        ...defaultFilters,
        query: 'M416',
      }
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('event-2');
  });

  it('does not mutate the source events', () => {
    const idsBefore = demoKillEvents.map(
      (event) => event.id
    );

    filterKillEvents(
      demoKillEvents,
      defaultFilters
    );

    expect(
      demoKillEvents.map((event) => event.id)
    ).toEqual(idsBefore);
  });

  it('returns empty results for unknown players', () => {
    const result = filterKillEvents(
      demoKillEvents,
      {
        ...defaultFilters,
        query: 'unknown-player',
      }
    );

    expect(result).toEqual([]);
  });

  it('rejects invalid event timestamps', () => {
    expect(() =>
      formatEventTime(Number.NaN)
    ).toThrow(RangeError);
  });
});
