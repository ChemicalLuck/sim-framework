import type { BaseEffect } from '@chemicalluck/sim-engine/types/effect.types';

/**
 * Map of calendar event categories. Extensions augment via:
 *
 *   declare module '@chemicalluck/sim-engine/features/calendar/types' {
 *     interface EventCategoryMap { myCategory: true; }
 *   }
 */
export interface EventCategoryMap {
  work: true;
  social: true;
}

export type EventCategory = keyof EventCategoryMap;

/**
 * Day of week: 0 = Sunday, 1 = Monday … 5 = Friday, 6 = Saturday. Same
 * convention as `Date.getDay()` and the `gameweekday` condition id.
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ScheduledEvent {
  id: string;
  label: string;
  category: EventCategory;
  /** Day of week, 0 = Sunday … 6 = Saturday (read in game time, see `time/lib/game-time`). */
  dayOfWeek: DayOfWeek;
  hour: number;
  durationMinutes: number;
}

export interface CalendarState {
  events: ScheduledEvent[];
}

/**
 * Schedule, unschedule, or clear calendar events from gameplay. The `add`
 * operation upserts by `event.id`, so re-adding the same id updates it.
 */
export type CalendarEffect =
  | (BaseEffect<'calendar'> & { operation: 'add'; event: ScheduledEvent })
  | (BaseEffect<'calendar'> & { operation: 'remove'; id: string })
  | (BaseEffect<'calendar'> & { operation: 'clear' });

declare module '@chemicalluck/sim-engine/types/effect.types' {
  interface EffectMap {
    calendar: CalendarEffect;
  }
}
