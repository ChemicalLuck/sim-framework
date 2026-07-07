import { createSelector } from '@reduxjs/toolkit';

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
    const date = new Date(now);
    const jsDay = date.getDay();
    if (jsDay === 0 || jsDay === 6) return null;
    const currentMinutes = date.getHours() * 60 + date.getMinutes();

    let soonest: { label: string; minutesUntil: number } | null = null;
    for (const event of events) {
      if (event.dayOfWeek !== jsDay) continue;
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
