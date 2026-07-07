import type {
  NearbyConditions,
  NearbyScheduleSlot,
} from '@chemicalluck/engine/features/travel/types';

export type { NearbyScheduleSlot };

/** Students only (18–25). Use for campus locations. */
export const nearbyStudents = (
  min: number,
  max: number,
  schedule?: NearbyScheduleSlot[],
): NearbyConditions => ({
  professions: ['Student'],
  minAge: 18,
  maxAge: 25,
  min,
  max,
  schedule,
});

/** General public — no profession or gender filter. */
export const nearbyPublic = (
  min: number,
  max: number,
  schedule?: NearbyScheduleSlot[],
): NearbyConditions => ({
  min,
  max,
  schedule,
});

/** Young adults (18–30), mixed professions. Use for cafés, gyms, parks. */
export const nearbyYoungAdults = (
  min: number,
  max: number,
  schedule?: NearbyScheduleSlot[],
): NearbyConditions => ({
  minAge: 18,
  maxAge: 30,
  min,
  max,
  schedule,
});

/** Nightlife crowd (18–35). Use for bars, clubs, late-night venues. */
export const nearbyNightlife = (
  min: number,
  max: number,
  schedule?: NearbyScheduleSlot[],
): NearbyConditions => ({
  minAge: 18,
  maxAge: 35,
  min,
  max,
  schedule,
});
