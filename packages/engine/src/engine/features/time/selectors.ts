import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@sim/engine/state/store';

export const selectTimestamp = (state: RootState) =>
  state.present.time.timestamp;

// Memoized Date conversion — only recalculated when timestamp changes
export const selectDate = createSelector(
  [selectTimestamp],
  (timestamp) => new Date(timestamp),
);

// Derived selectors
export const selectHour = createSelector([selectDate], (date) =>
  date.getHours(),
);

export const selectMinute = createSelector([selectDate], (date) =>
  date.getMinutes(),
);

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
