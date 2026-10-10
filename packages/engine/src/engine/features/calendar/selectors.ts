import { createSelector } from '@reduxjs/toolkit';

import {
  gameHour,
  gameMinute,
  gameWeekday,
} from '@chemicalluck/sim-engine/features/time/lib/game-time';

import type { ScheduledEvent } from './types';

interface CalendarState {
  present: {
    calendar: { events: ScheduledEvent[] };
    time: { timestamp: number };
  };
}

export const selectCalendarEvents = (state: unknown): ScheduledEvent[] =>
  (state as CalendarState).present.calendar.events;

export const selectUpcomingEvent = createSelector(
  selectCalendarEvents,
  (state: unknown) => (state as CalendarState).present.time.timestamp,
  (events, now) => {
    const weekday = gameWeekday(now);
    const currentMinutes = gameHour(now) * 60 + gameMinute(now);

    let soonest: { label: string; minutesUntil: number } | null = null;
    for (const event of events) {
      if (event.dayOfWeek !== weekday) continue;
      const minutesUntil = event.hour * 60 - currentMinutes;
      if (minutesUntil > 0 && minutesUntil <= 30) {
        if (!soonest || minutesUntil < soonest.minutesUntil) {
          soonest = { label: event.label, minutesUntil };
        }
      }
    }
    return soonest;
  },
);
