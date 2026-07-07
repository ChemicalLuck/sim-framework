import {
  type EffectContext,
  dispatchWithGroup,
} from '@chemicalluck/sim-engine/features/core/types';
import { GlobalLogger } from '@chemicalluck/sim-engine/lib/logger';

import {
  addCalendarEvent,
  clearCalendarEvents,
  removeCalendarEvent,
} from './slice';
import type { CalendarEffect } from './types';

const logger = GlobalLogger.child('calendar');

export function handleCalendarEffect(
  effect: CalendarEffect,
  { dispatch, group }: EffectContext,
) {
  switch (effect.operation) {
    case 'add':
      logger.debug('Scheduling calendar event:', effect.event);
      dispatchWithGroup(dispatch, addCalendarEvent(effect.event), group);
      break;
    case 'remove':
      logger.debug('Removing calendar event:', effect.id);
      dispatchWithGroup(dispatch, removeCalendarEvent(effect.id), group);
      break;
    case 'clear':
      logger.debug('Clearing calendar events');
      dispatchWithGroup(dispatch, clearCalendarEvents(), group);
      break;
  }
}

export default { calendar: handleCalendarEffect };
