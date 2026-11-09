
import type {
  PubgCrateDrop,
  PubgVnSquadStanding,
} from '../domain/pubg-vn-arena-contract';

// Demo deadline: 15 minutes after page module initialization.
const demoDropEpochMs = Date.now() - 60_000;

export const demoDrops: readonly PubgCrateDrop[] = [
  {
    id: 'pvs-vip-pass',
    title: 'PVS Finals VIP Pass + 5,000 G-Coin',
    priceVnd: 499000,
    remainingStock: 50,
    dropEpochMs: demoDropEpochMs,
  },
  {
    id: 'gcoin-crate',
    title: 'PUBG G-Coin Crate',
    priceVnd: 79000,
    remainingStock: 100,
    dropEpochMs: demoDropEpochMs,
  },
];

export const demoSquads: readonly PubgVnSquadStanding[] = [
  {
    squadId: 'the-expendables',
    squadName: 'The Expendables',
    wwcdCount: 3,
    placementPts: 45,
    killPts: 62,
  },
  {
    squadId: 'cerberus-esports',
    squadName: 'Cerberus Esports',
    wwcdCount: 2,
    placementPts: 42,
    killPts: 58,
  },
  {
    squadId: 'roy-esports',
    squadName: 'Roy Esports',
    wwcdCount: 1,
    placementPts: 38,
    killPts: 54,
  },
  {
    squadId: 'agg',
    squadName: 'AGG',
    wwcdCount: 1,
    placementPts: 32,
    killPts: 47,
  },
];

export function formatVnd(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('Invalid VND amount');
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

export function validateDrops(
  drops: readonly PubgCrateDrop[]
): boolean {
  const ids = new Set<string>();

  for (const drop of drops) {
    if (
      !drop.id.trim() ||
      !drop.title.trim() ||
      ids.has(drop.id) ||
      !Number.isFinite(drop.priceVnd) ||
      drop.priceVnd < 0 ||
      !Number.isInteger(drop.remainingStock) ||
      drop.remainingStock < 0 ||
      !Number.isFinite(drop.dropEpochMs)
    ) {
      return false;
    }

    ids.add(drop.id);
  }

  return true;
}

export function validateSquads(
  squads: readonly PubgVnSquadStanding[]
): boolean {
  const ids = new Set<string>();

  for (const squad of squads) {
    if (
      !squad.squadId.trim() ||
      !squad.squadName.trim() ||
      ids.has(squad.squadId) ||
      !Number.isInteger(squad.wwcdCount) ||
      squad.wwcdCount < 0 ||
      !Number.isInteger(squad.placementPts) ||
      squad.placementPts < 0 ||
      !Number.isInteger(squad.killPts) ||
      squad.killPts < 0
    ) {
      return false;
    }

    ids.add(squad.squadId);
  }

  return true;
}
