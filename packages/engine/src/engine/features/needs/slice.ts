import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type {
  Need,
  NeedOptions,
} from '@chemicalluck/sim-engine/features/needs/types';
import { makeConfig } from '@chemicalluck/sim-engine/lib/core';
import { clampAdd } from '@chemicalluck/sim-engine/lib/maths';
import type { Effect } from '@chemicalluck/sim-engine/types/effect.types';

export interface NeedsConfig<E = Effect> {
  needs: Record<string, number>;
  /**
   * Points per hour each need falls over time. A negative rate makes the need
   * rise instead (e.g. stress).
   */
  decayRates: Record<string, number>;
  /** Which need restores during sleep instead of decaying (default: 'Energy') */
  sleepRestoreNeed?: string;
  /** Per-need direction, display and threshold options. */
  options?: Record<string, NeedOptions<E> | undefined>;
}

const _config = makeConfig<NeedsConfig>({
  needs: { Energy: 100, Hunger: 100, Bladder: 100, Hygiene: 100, Fun: 100 },
  decayRates: { Energy: 5, Hunger: 15, Bladder: 30, Hygiene: 2, Fun: 2 },
  sleepRestoreNeed: 'Energy',
});

export function configureNeeds(config: NeedsConfig<unknown>) {
  _config.configure({ sleepRestoreNeed: 'Energy', ...(config as NeedsConfig) });
}

export function getNeedOptions(): NonNullable<NeedsConfig['options']> {
  return _config.get().options ?? {};
}

function createNeedsSlice() {
  return createSlice({
    name: 'needs',
    initialState: (): Record<Need, number> => ({ ..._config.get().needs }),
    reducers: {
      decayNeedsByMinutes: (
        state,
        action: PayloadAction<{ minutes: number; sleep: boolean }>,
      ) => {
        const { minutes, sleep } = action.payload;
        const cfg = _config.get();
        const restoreKey = cfg.sleepRestoreNeed ?? 'Energy';

        for (const need of Object.keys(state)) {
          const ratePerHour = cfg.decayRates[need] ?? 0;
          const inverse = cfg.options?.[need]?.direction === 'inverse';
          // Signed change per minute; the good end is 100, or 0 when inverse.
          const change = -ratePerHour / 60;
          const towardBad = inverse ? change > 0 : change < 0;

          if (need === restoreKey && sleep) {
            const restore = (Math.abs(ratePerHour) * 2) / 60;
            state[need] = clampAdd(
              state[need],
              (inverse ? -restore : restore) * minutes,
            );
          } else {
            // Sleep slows needs getting worse, not recovering.
            const multiplier = sleep && towardBad ? 0.1 : 1;
            state[need] = clampAdd(state[need], change * minutes * multiplier);
          }
        }
      },

      increaseNeedByAmount: (
        state,
        action: PayloadAction<{ need: Need; amount: number }>,
      ) => {
        const { need, amount } = action.payload;
        if (need in state) {
          state[need] = clampAdd(state[need], amount);
        }
      },
    },
  });
}

export const needsSlice = createNeedsSlice();

export const { decayNeedsByMinutes, increaseNeedByAmount } = needsSlice.actions;

export default needsSlice.reducer;

declare module '@chemicalluck/sim-engine/state/store' {
  interface PresentState {
    needs: ReturnType<typeof needsSlice.reducer>;
  }
}
