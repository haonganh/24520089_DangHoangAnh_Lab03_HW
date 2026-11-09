
import { useState } from 'react';

import type { CSSProperties } from 'react';

import {
  formatEventTime,
} from '../killfeed/kill-feed';

import type {
  KillFeedEvent,
} from '../killfeed/kill-feed';

import {
  getVirtualWindow,
} from '../virtualization/virtual-window';

interface Props {
  events: readonly KillFeedEvent[];
}

interface EventRowProps {
  event: KillFeedEvent;
  index: number;
  total: number;
  style?: CSSProperties;
}

const ROW_HEIGHT = 136;
const VIEWPORT_HEIGHT = 420;
const OVERSCAN = 3;

function EventRow({
  event,
  index,
  total,
  style,
}: EventRowProps) {
  return (
    <li
      className="killfeed-item"
      style={style}
      aria-posinset={index + 1}
      aria-setsize={total}
    >
      <span className="killfeed-time">
        <time
          dateTime={
            new Date(event.timestamp).toISOString()
          }
        >
          {formatEventTime(event.timestamp)}
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
  );
}

export function VirtualKillFeedList({
  events,
}: Props) {
  const [scrollTop, setScrollTop] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const virtualWindow = getVirtualWindow(
    events.length,
    scrollTop,
    VIEWPORT_HEIGHT,
    ROW_HEIGHT,
    OVERSCAN
  );

  const visibleEvents = events.slice(
    virtualWindow.startIndex,
    virtualWindow.endIndex
  );

  if (events.length === 0) {
    return (
      <p>No events match your filters.</p>
    );
  }

  return (
    <div className="killfeed-list">
      <button
        type="button"
        className="secondary-button"
        aria-pressed={showAll}
        onClick={() => setShowAll((value) => !value)}
      >
        {showAll
          ? 'Enable virtual scrolling'
          : 'Show all events'}
      </button>

      <p>
        {showAll
          ? `Showing all ${events.length} events.`
          : `Virtual scrolling enabled for ${events.length} events.`}
      </p>

      {showAll ? (
        <ol aria-label="All PUBG combat events">
          {events.map((event, index) => (
            <EventRow
              key={event.id}
              event={event}
              index={index}
              total={events.length}
            />
          ))}
        </ol>
      ) : (
        <div
          className="virtual-killfeed-viewport"
          role="region"
          aria-label="Scrollable PUBG kill feed"
          tabIndex={0}
          onScroll={(event) => {
            setScrollTop(
              event.currentTarget.scrollTop
            );
          }}
        >
          <ol
            className="virtual-killfeed-list"
            aria-label="Visible PUBG combat events"
            style={{
              height: virtualWindow.totalHeight,
            }}
          >
            {visibleEvents.map((event, index) => {
              const actualIndex =
                virtualWindow.startIndex + index;

              return (
                <EventRow
                  key={event.id}
                  event={event}
                  index={actualIndex}
                  total={events.length}
                  style={{
                    position: 'absolute',
                    top: actualIndex * ROW_HEIGHT,
                    left: 0,
                    right: 0,
                    height: ROW_HEIGHT - 8,
                  }}
                />
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
