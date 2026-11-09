
import {
  memo,
  useMemo,
  useRef,
  useState,
} from 'react';

import { demoSquads } from '../demo/demoFixtures';

import {
  demoKillEvents,
  filterKillEvents,
} from '../killfeed/kill-feed';

import type {
  KillEventType,
  KillFeedEvent,
} from '../killfeed/kill-feed';

import {
  VirtualKillFeedList,
} from './VirtualKillFeedList';

export const KillFeed = memo(function KillFeed() {
  const [events, setEvents] = useState<
    readonly KillFeedEvent[]
  >(demoKillEvents);

  const [query, setQuery] = useState('');
  const [squadId, setSquadId] = useState('ALL');

  const [eventType, setEventType] = useState<
    'ALL' | KillEventType
  >('ALL');

  const [announcement, setAnnouncement] =
    useState('');

  const [bulkLoaded, setBulkLoaded] =
    useState(false);

  const nextEventNumber = useRef(1);

  const filteredEvents = useMemo(
    () =>
      filterKillEvents(events, {
        query,
        squadId,
        type: eventType,
      }),
    [events, query, squadId, eventType]
  );

  const addDemoEvent = () => {
    const number = nextEventNumber.current++;
    const squad = demoSquads[
      (number - 1) % demoSquads.length
    ];

    const newEvent: KillFeedEvent = {
      id: `live-event-${number}`,
      killer: `${squad.squadName} Player`,
      victim: `Opponent ${number}`,
      squadId: squad.squadId,
      weapon:
        number % 2 === 0 ? 'M416' : 'Beryl M762',
      type:
        number % 3 === 0 ? 'KNOCK' : 'KILL',
      timestamp: Date.now(),
    };

    setEvents((previous) => [
      newEvent,
      ...previous,
    ]);

    setAnnouncement(
      `New ${newEvent.type.toLowerCase()} event: ` +
      `${newEvent.killer} against ${newEvent.victim}.`
    );
  };

  // T12: Generate 1,000 events for performance testing.
  const addBulkEvents = () => {
    if (bulkLoaded) return;

    const now = Date.now();

    const generated: KillFeedEvent[] =
      Array.from({ length: 1000 }, (_, index) => {
        const squad = demoSquads[
          index % demoSquads.length
        ];

        return {
          id: `stress-${now}-${index}`,
          killer:
            `${squad.squadName} Player ${index % 4 + 1}`,
          victim: `Opponent ${index + 1}`,
          squadId: squad.squadId,
          weapon:
            index % 2 === 0 ? 'M416' : 'Beryl M762',
          type:
            index % 3 === 0 ? 'KNOCK' : 'KILL',
          timestamp: now + index,
        };
      });

    setEvents((previous) => [
      ...generated,
      ...previous,
    ]);

    setBulkLoaded(true);

    setAnnouncement(
      'Added 1,000 simulated combat events.'
    );
  };

  return (
    <section
      className="killfeed-section"
      aria-labelledby="killfeed-title"
    >
      <h2 id="killfeed-title">
        PUBG Vietnam Kill Feed
      </h2>

      <p>
        Simulated combat events with virtual scrolling,
        squad filtering and event type filtering.
      </p>

      <div className="killfeed-controls">
        <div>
          <label htmlFor="killfeed-search">
            Search players or weapons
          </label>

          <input
            id="killfeed-search"
            type="search"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
          />
        </div>

        <div>
          <label htmlFor="killfeed-squad">
            Filter by squad
          </label>

          <select
            id="killfeed-squad"
            value={squadId}
            onChange={(event) =>
              setSquadId(event.target.value)
            }
          >
            <option value="ALL">
              All squads
            </option>

            {demoSquads.map((squad) => (
              <option
                key={squad.squadId}
                value={squad.squadId}
              >
                {squad.squadName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="killfeed-type">
            Filter by event type
          </label>

          <select
            id="killfeed-type"
            value={eventType}
            onChange={(event) =>
              setEventType(
                event.target.value as
                  'ALL' | KillEventType
              )
            }
          >
            <option value="ALL">
              All events
            </option>

            <option value="KILL">
              Kills
            </option>

            <option value="KNOCK">
              Knocks
            </option>
          </select>
        </div>
      </div>

      <div className="killfeed-actions">
        <button
          type="button"
          onClick={addDemoEvent}
        >
          Add simulated combat event
        </button>

        <button
          type="button"
          onClick={addBulkEvents}
          disabled={bulkLoaded}
        >
          {bulkLoaded
            ? '1,000 events loaded'
            : 'Load 1,000 test events'}
        </button>
      </div>

      <p role="status" aria-live="polite">
        {announcement}
      </p>

      <p>
        Showing {filteredEvents.length} of{' '}
        {events.length} events.
      </p>

      <VirtualKillFeedList
        key={`${query}|${squadId}|${eventType}`}
        events={filteredEvents}
      />
    </section>
  );
});
