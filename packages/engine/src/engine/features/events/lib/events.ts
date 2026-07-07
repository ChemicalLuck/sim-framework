import type { RandomEvent } from '@sim/engine/features/events/types';

let _events: RandomEvent[] = [];

export function configureEvents(events: RandomEvent[]) {
  _events = events;
}

export function getEvents(): RandomEvent[] {
  return _events;
}
