import type { BaseEffect } from '@chemicalluck/engine/types/effect.types';

/**
 * Map of calendar event categories. Extensions augment via:
 *
 *   declare module '@chemicalluck/engine/features/calendar/types' {
 *     interface EventCategoryMap { myCategory: true; }
 *   }
 */
export interface EventCategoryMap {
  work: true;
  social: true;
}

export type EventCategory = keyof EventCategoryMap;

export interface ScheduledEvent {
  id: string;
  label: string;
  category: EventCategory;
  /** Day of week: 1 = Monday … 5 = Friday (matches JS Date.getDay() for Mon–Fri) */
  dayOfWeek: 1 | 2 | 3 | 4 | 5;
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

declare module '@chemicalluck/engine/types/effect.types' {
  interface EffectMap {
    calendar: CalendarEffect;
  }
}
