
import { memo, useMemo, useState } from 'react';

import { demoSquads } from '../demo/demoFixtures';

import {
  getLeaderboard,
  getTotalPoints,
} from '../leaderboard/leaderboard';

import type {
  LeaderboardSort,
} from '../leaderboard/leaderboard';

const sortLabels: Record<LeaderboardSort, string> = {
  total: 'Total points',
  wwcd: 'WWCD',
  placement: 'Placement points',
  kills: 'Kill points',
};

export const Leaderboard = memo(function Leaderboard() {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] =
    useState<LeaderboardSort>('total');

  const squads = useMemo(
    () => getLeaderboard(demoSquads, query, sortBy),
    [query, sortBy]
  );

  return (
    <section
      className="leaderboard-section"
      aria-labelledby="leaderboard-title"
    >
      <h2 id="leaderboard-title">
        PUBG Vietnam Leaderboard
      </h2>

      <p>
        Demo squad standings based on WWCD,
        placement points and kill points.
      </p>

      <div className="leaderboard-controls">
        <div>
          <label htmlFor="squad-search">
            Search squads
          </label>

          <input
            id="squad-search"
            type="search"
            value={query}
            placeholder="Enter squad name"
            onChange={(event) =>
              setQuery(event.target.value)
            }
          />
        </div>

        <div>
          <label htmlFor="leaderboard-sort">
            Sort leaderboard by
          </label>

          <select
            id="leaderboard-sort"
            value={sortBy}
            onChange={(event) =>
              setSortBy(
                event.target.value as LeaderboardSort
              )
            }
          >
            <option value="total">
              Total points
            </option>

            <option value="wwcd">
              WWCD
            </option>

            <option value="placement">
              Placement points
            </option>

            <option value="kills">
              Kill points
            </option>
          </select>
        </div>
      </div>

      <p role="status" aria-live="polite">
        Showing {squads.length} of {demoSquads.length}
        {' '}squads. Sorted by {sortLabels[sortBy]}.
      </p>

      <div
        className="leaderboard-scroll"
        role="region"
        aria-label="PUBG Vietnam standings table"
        tabIndex={0}
      >
        <table>
          <caption>
            PUBG Vietnam Championship –
            simulated standings
          </caption>

          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Squad</th>
              <th scope="col">WWCD</th>
              <th scope="col">Placement pts</th>
              <th scope="col">Kill pts</th>
              <th scope="col">Total pts</th>
            </tr>
          </thead>

          <tbody>
            {squads.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  No squads match your search.
                </td>
              </tr>
            ) : (
              squads.map((squad, index) => (
                <tr key={squad.squadId}>
                  <td>{index + 1}</td>
                  <th scope="row">
                    {squad.squadName}
                  </th>
                  <td>{squad.wwcdCount}</td>
                  <td>{squad.placementPts}</td>
                  <td>{squad.killPts}</td>
                  <td>
                    <strong>
                      {getTotalPoints(squad)}
                    </strong>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
});
