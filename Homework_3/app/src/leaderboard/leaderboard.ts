
import type {
  PubgVnSquadStanding,
} from '../domain/pubg-vn-arena-contract';

export type LeaderboardSort =
  | 'total'
  | 'wwcd'
  | 'placement'
  | 'kills';

export function getTotalPoints(
  squad: PubgVnSquadStanding
): number {
  return squad.placementPts + squad.killPts;
}

function getSortValue(
  squad: PubgVnSquadStanding,
  sortBy: LeaderboardSort
): number {
  switch (sortBy) {
    case 'wwcd':
      return squad.wwcdCount;
    case 'placement':
      return squad.placementPts;
    case 'kills':
      return squad.killPts;
    default:
      return getTotalPoints(squad);
  }
}

export function getLeaderboard(
  squads: readonly PubgVnSquadStanding[],
  query = '',
  sortBy: LeaderboardSort = 'total'
): PubgVnSquadStanding[] {
  const normalizedQuery = query.trim().toLowerCase();

  return squads
    .filter((squad) =>
      squad.squadName
        .toLowerCase()
        .includes(normalizedQuery)
    )
    .sort((a, b) => {
      const primary =
        getSortValue(b, sortBy) -
        getSortValue(a, sortBy);

      if (primary !== 0) return primary;

      const totalDifference =
        getTotalPoints(b) - getTotalPoints(a);

      if (totalDifference !== 0) {
        return totalDifference;
      }

      return a.squadName.localeCompare(b.squadName);
    });
}
