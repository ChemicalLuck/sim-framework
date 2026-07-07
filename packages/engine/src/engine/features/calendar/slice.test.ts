import { describe, expect, it } from 'vitest';

import reducer, {
  addCalendarEvent,
  clearCalendarEvents,
  removeCalendarEvent,
  setCalendarEvents,
} from './slice';
import type { ScheduledEvent } from './types';

const event: ScheduledEvent = {
  id: 'biology',
  label: 'Biology Lecture',
  category: 'work',
  dayOfWeek: 1,
  hour: 9,
  durationMinutes: 60,
};

describe('calendar slice', () => {
  it('starts with no events', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({ events: [] });
  });

  it('setCalendarEvents replaces the schedule', () => {
    const next = reducer(undefined, setCalendarEvents([event]));
    expect(next.events).toEqual([event]);
  });

  it('clearCalendarEvents empties the schedule', () => {
    const next = reducer({ events: [event] }, clearCalendarEvents());
    expect(next.events).toEqual([]);
  });

  it('addCalendarEvent appends a new event', () => {
    const next = reducer({ events: [] }, addCalendarEvent(event));
    expect(next.events).toEqual([event]);
  });

  it('addCalendarEvent upserts an event with the same id', () => {
    const updated: ScheduledEvent = { ...event, label: 'Renamed' };
    const next = reducer({ events: [event] }, addCalendarEvent(updated));
    expect(next.events).toHaveLength(1);
    expect(next.events[0].label).toBe('Renamed');
  });

  it('removeCalendarEvent drops the matching event', () => {
    const other: ScheduledEvent = { ...event, id: 'chemistry' };
    const next = reducer(
      { events: [event, other] },
      removeCalendarEvent('biology'),
    );
    expect(next.events).toEqual([other]);
  });
});
