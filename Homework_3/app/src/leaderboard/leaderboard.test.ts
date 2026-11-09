
import { describe, expect, it } from 'vitest';

import type {
  PubgVnSquadStanding,
} from '../domain/pubg-vn-arena-contract';

import {
  getLeaderboard,
  getTotalPoints,
} from './leaderboard';

const squads: PubgVnSquadStanding[] = [
  {
    squadId: 'a',
    squadName: 'Alpha',
    wwcdCount: 1,
    placementPts: 50,
    killPts: 0,
  },
  {
    squadId: 'b',
    squadName: 'Bravo',
    wwcdCount: 3,
    placementPts: 10,
    killPts: 30,
  },
  {
    squadId: 'c',
    squadName: 'Charlie',
    wwcdCount: 0,
    placementPts: 1,
    killPts: 80,
  },
];

describe('T10 - PUBG Vietnam Leaderboard', () => {
  it('calculates total points', () => {
    expect(getTotalPoints(squads[0])).toBe(50);
  });

  it('sorts by total points', () => {
    const result = getLeaderboard(squads);

    expect(result.map((s) => s.squadId))
      .toEqual(['c', 'a', 'b']);
  });

  it('sorts by WWCD', () => {
    const result = getLeaderboard(squads, '', 'wwcd');

    expect(result.map((s) => s.squadId))
      .toEqual(['b', 'a', 'c']);
  });

  it('sorts by placement points', () => {
    const result = getLeaderboard(
      squads,
      '',
      'placement'
    );

    expect(result.map((s) => s.squadId))
      .toEqual(['a', 'b', 'c']);
  });

  it('sorts by kill points', () => {
    const result = getLeaderboard(squads, '', 'kills');

    expect(result.map((s) => s.squadId))
      .toEqual(['c', 'b', 'a']);
  });

  it('filters squads case-insensitively', () => {
    const result = getLeaderboard(squads, 'BRAVO');

    expect(result).toHaveLength(1);
    expect(result[0].squadId).toBe('b');
  });

  it('trims search whitespace', () => {
    const result = getLeaderboard(
      squads,
      '  alpha  '
    );

    expect(result).toHaveLength(1);
  });

  it('returns empty results when not found', () => {
    expect(getLeaderboard(squads, 'unknown'))
      .toEqual([]);
  });

  it('does not mutate original data', () => {
    const originalOrder = squads.map(
      (squad) => squad.squadId
    );

    getLeaderboard(squads, '', 'kills');

    expect(squads.map((squad) => squad.squadId))
      .toEqual(originalOrder);
  });
});
