import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@chemicalluck/sim-engine/state/store';

import { gameHour, gameMinute } from './lib/game-time';

export const selectTimestamp = (state: RootState) =>
  state.present.time.timestamp;

// Memoized Date conversion — only recalculated when timestamp changes
export const selectDate = createSelector(
  [selectTimestamp],
  (timestamp) => new Date(timestamp),
);

// Derived selectors — read in game (UTC) time, see lib/game-time
export const selectHour = createSelector([selectTimestamp], gameHour);

export const selectMinute = createSelector([selectTimestamp], gameMinute);

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/** Part-of-day label derived from the hour: morning 5–11, afternoon 12–16, evening 17–20, else night. */
export const selectTimeOfDay = createSelector(
  [selectHour],
  (hour): TimeOfDay => {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  },
);
