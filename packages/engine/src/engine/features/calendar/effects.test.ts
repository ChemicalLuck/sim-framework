import { describe, expect, it, vi } from 'vitest';
import type { EffectContext } from '@chemicalluck/sim-engine/features/core/types';

import { handleCalendarEffect } from './effects';
import type { CalendarEffect, ScheduledEvent } from './types';

interface DispatchedAction {
  type: string;
  payload?: unknown;
  meta?: unknown;
}

function makeContext() {
  const dispatch = vi.fn<(action: DispatchedAction) => void>();
  const ctx = {
    dispatch,
    group: 'g',
    effects: [],
  } as unknown as EffectContext;
  return { dispatch, ctx };
}

const event: ScheduledEvent = {
  id: 'biology',
  label: 'Biology Lecture',
  category: 'work',
  dayOfWeek: 1,
  hour: 9,
  durationMinutes: 60,
};

describe('calendar effect', () => {
  it('add dispatches addCalendarEvent with the event', () => {
    const { dispatch, ctx } = makeContext();
    handleCalendarEffect({ kind: 'calendar', operation: 'add', event }, ctx);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'calendar/addCalendarEvent',
        payload: event,
        meta: { group: 'g' },
      }),
    );
  });

  it('remove dispatches removeCalendarEvent with the id', () => {
    const { dispatch, ctx } = makeContext();
    const effect: CalendarEffect = {
      kind: 'calendar',
      operation: 'remove',
      id: 'biology',
    };
    handleCalendarEffect(effect, ctx);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'calendar/removeCalendarEvent',
        payload: 'biology',
      }),
    );
  });

  it('clear dispatches clearCalendarEvents', () => {
    const { dispatch, ctx } = makeContext();
    handleCalendarEffect({ kind: 'calendar', operation: 'clear' }, ctx);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'calendar/clearCalendarEvents' }),
    );
  });
});
