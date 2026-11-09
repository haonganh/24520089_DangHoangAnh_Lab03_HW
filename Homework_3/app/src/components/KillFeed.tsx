
import { memo, useMemo, useRef, useState } from 'react';

import { demoSquads } from '../demo/demoFixtures';

import {
  demoKillEvents,
  filterKillEvents,
  formatEventTime,
} from '../killfeed/kill-feed';

import type {
  KillEventType,
  KillFeedEvent,
} from '../killfeed/kill-feed';

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
      weapon: number % 2 === 0 ? 'M416' : 'Beryl M762',
      type: number % 3 === 0 ? 'KNOCK' : 'KILL',
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

  return (
    <section
      className="killfeed-section"
      aria-labelledby="killfeed-title"
    >
      <h2 id="killfeed-title">
        PUBG Vietnam Kill Feed
      </h2>

      <p>
        Simulated combat events. Filter by squad,
        event type or player name.
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
            <option value="ALL">All squads</option>

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
            <option value="ALL">All events</option>
            <option value="KILL">Kills</option>
            <option value="KNOCK">Knocks</option>
          </select>
        </div>
      </div>

      <button type="button" onClick={addDemoEvent}>
        Add simulated combat event
      </button>

      <p role="status" aria-live="polite">
        {announcement}
      </p>

      <p>
        Showing {filteredEvents.length} of{' '}
        {events.length} events.
      </p>

      <div
        className="killfeed-list"
        role="log"
        aria-label="PUBG combat event history"
        aria-live="off"
      >
        {filteredEvents.length === 0 ? (
          <p>No events match your filters.</p>
        ) : (
          <ol>
            {filteredEvents.map((event) => (
              <li
                key={event.id}
                className="killfeed-item"
              >
                <span className="killfeed-time">
                  <time
                    dateTime={
                      new Date(
                        event.timestamp
                      ).toISOString()
                    }
                  >
                    {formatEventTime(
                      event.timestamp
                    )}
                  </time>
                </span>

                <span>
                  <strong>{event.killer}</strong>
                  {' '}
                  {event.type === 'KILL'
                    ? 'eliminated'
                    : 'knocked'}
                  {' '}
                  <strong>{event.victim}</strong>
                </span>

                <span>
                  Weapon: {event.weapon}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
});
