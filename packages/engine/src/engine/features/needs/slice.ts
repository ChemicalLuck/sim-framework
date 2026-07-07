import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import type { Need } from '@chemicalluck/sim-engine/features/needs/types';
import { makeConfig } from '@chemicalluck/sim-engine/lib/core';
import { clampAdd } from '@chemicalluck/sim-engine/lib/maths';

export interface NeedsConfig {
  needs: Record<string, number>;
  decayRates: Record<string, number>;
  /** Which need restores during sleep instead of decaying (default: 'Energy') */
  sleepRestoreNeed?: string;
}

const _config = makeConfig<NeedsConfig>({
  needs: { Energy: 100, Hunger: 100, Bladder: 100, Hygiene: 100, Fun: 100 },
  decayRates: { Energy: 5, Hunger: 15, Bladder: 30, Hygiene: 2, Fun: 2 },
  sleepRestoreNeed: 'Energy',
});

export function configureNeeds(config: NeedsConfig) {
  _config.configure({ sleepRestoreNeed: 'Energy', ...config });
}

function createNeedsSlice() {
  return createSlice({
    name: 'needs',
    initialState: () => ({ ..._config.get().needs }) as Record<Need, number>,
    reducers: {
      decayNeedsByMinutes: (
        state,
        action: PayloadAction<{ minutes: number; sleep: boolean }>,
      ) => {
        const { minutes, sleep } = action.payload;
        const cfg = _config.get();
        const restoreKey = cfg.sleepRestoreNeed ?? 'Energy';

        for (const need of Object.keys(state)) {
          const baseDecayPerHour = cfg.decayRates[need] ?? 0;
          const decayPerMinute = baseDecayPerHour / 60;

          if (need === restoreKey) {
            if (sleep) {
              const restorePerMinute = (baseDecayPerHour * 2) / 60;
              state[need] = clampAdd(state[need], restorePerMinute * minutes);
            } else {
              state[need] = clampAdd(state[need], -(decayPerMinute * minutes));
            }
          } else {
            const multiplier = sleep ? 0.1 : 1;
            state[need] = clampAdd(
              state[need],
              -(decayPerMinute * minutes * multiplier),
            );
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
