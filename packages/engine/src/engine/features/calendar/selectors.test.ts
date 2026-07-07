import { describe, expect, it } from 'vitest';

import { selectCalendarEvents, selectUpcomingEvent } from './selectors';
import type { ScheduledEvent } from './types';

interface MockState {
  present: {
    calendar: { events: ScheduledEvent[] };
    time: { timestamp: number };
  };
}

function makeState(events: ScheduledEvent[], isoTimestamp: string): MockState {
  return {
    present: {
      calendar: { events },
      time: { timestamp: new Date(isoTimestamp).getTime() },
    },
  };
}

const bio: ScheduledEvent = {
  label: 'Biology',
  dayOfWeek: 1,
  hour: 10,
} as ScheduledEvent;

const chem: ScheduledEvent = {
  label: 'Chemistry',
  dayOfWeek: 1,
  hour: 11,
} as ScheduledEvent;

describe('calendar selectors', () => {
  it('selectCalendarEvents returns the schedule', () => {
    const state = makeState([bio], '2026-01-05T09:00:00Z');
    expect(selectCalendarEvents(state)).toEqual([bio]);
  });

  it('selectUpcomingEvent returns null on weekends', () => {
    // 2026-01-03 is a Saturday (day 6).
    const state = makeState([bio], '2026-01-03T09:00:00');
    expect(selectUpcomingEvent(state)).toBeNull();
  });

  it('selectUpcomingEvent returns an event within 30 minutes', () => {
    // Monday 09:45 local — Biology is at 10:00, 15 minutes away.
    const state = makeState([bio], '2026-01-05T09:45:00');
    expect(selectUpcomingEvent(state)).toEqual({
      label: 'Biology',
      minutesUntil: 15,
    });
  });

  it('selectUpcomingEvent prefers the soonest event', () => {
    // 09:45 — Biology (10:00) at 15min, Chemistry (11:00) at 75min (outside window).
    const state = makeState([chem, bio], '2026-01-05T09:45:00');
    expect(selectUpcomingEvent(state)?.label).toBe('Biology');
  });

  it('selectUpcomingEvent returns null when no event is within 30 minutes', () => {
    const state = makeState([bio], '2026-01-05T07:00:00');
    expect(selectUpcomingEvent(state)).toBeNull();
  });
});
