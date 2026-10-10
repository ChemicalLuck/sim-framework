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

  it('selectUpcomingEvent returns weekend events', () => {
    const football = {
      label: 'Football',
      dayOfWeek: 6,
      hour: 10,
    } as ScheduledEvent;
    const brunch = {
      label: 'Brunch',
      dayOfWeek: 0,
      hour: 11,
    } as ScheduledEvent;
    // 2026-01-03 is a Saturday, 2026-01-04 a Sunday.
    expect(
      selectUpcomingEvent(
        makeState([football, brunch], '2026-01-03T09:45:00Z'),
      ),
    ).toEqual({ label: 'Football', minutesUntil: 15 });
    expect(
      selectUpcomingEvent(
        makeState([football, brunch], '2026-01-04T10:40:00Z'),
      ),
    ).toEqual({ label: 'Brunch', minutesUntil: 20 });
  });

  it('selectUpcomingEvent reads the weekday in game (UTC) time', () => {
    const original = process.env.TZ;
    try {
      // Saturday 05:45 UTC is still Friday evening in Los Angeles.
      process.env.TZ = 'America/Los_Angeles';
      const early = { label: 'Early', dayOfWeek: 6, hour: 6 } as ScheduledEvent;
      const state = makeState([early], '2026-01-03T05:45:00Z');
      expect(selectUpcomingEvent(state)).toEqual({
        label: 'Early',
        minutesUntil: 15,
      });
    } finally {
      process.env.TZ = original;
    }
  });

  it('selectUpcomingEvent returns null when no event is within 30 minutes', () => {
    const state = makeState([bio], '2026-01-05T07:00:00');
    expect(selectUpcomingEvent(state)).toBeNull();
  });
});
