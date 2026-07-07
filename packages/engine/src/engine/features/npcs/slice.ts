import {
  type PayloadAction,
  type UnknownAction,
  createSlice,
} from '@reduxjs/toolkit';
import { REHYDRATE } from 'redux-persist';
import { getNamedNpcs } from '@chemicalluck/sim-engine/features/npcs/lib/named-npcs';
import { createNpc } from '@chemicalluck/sim-engine/features/npcs/lib/npcs';
import type { NPC } from '@chemicalluck/sim-engine/features/npcs/types';
import { Mulberry32 } from '@chemicalluck/sim-engine/features/rng/lib/rng';
import { logTimed } from '@chemicalluck/sim-engine/features/time/lib/time';

function generateNPCs(seed: number, count = 10000): NPC[] {
  const npcs: NPC[] = [];

  for (let i = 0; i < count; i++) {
    const rng = new Mulberry32(seed + i * 97);
    npcs.push(createNpc(rng));
  }

  return npcs;
}

interface NpcsState {
  seed: number;
  characters: NPC[];
  named: NPC[];
  nearby: string[];
}

const initialState: NpcsState = {
  seed: 0,
  characters: [],
  named: [],
  nearby: [],
};

const npcsSlice = createSlice({
  name: 'npcs',
  initialState,
  reducers: {
    regenerateNpcs: (state, action: PayloadAction<number>) => {
      const seed = action.payload;
      state.seed = seed;
      state.characters = logTimed('Generate NPCs', () => generateNPCs(seed));
      state.named = getNamedNpcs();
      state.nearby = [];
    },
    setNearby: (state, action: PayloadAction<string[]>) => {
      state.nearby = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: UnknownAction) => {
      if (action.key !== 'root') return;
      const payload = action.payload as
        | { present?: { npcs?: { seed?: number }; rng?: { seed?: number } } }
        | undefined;
      const savedSeed =
        payload?.present?.rng?.seed ?? payload?.present?.npcs?.seed;
      const activeSeed = savedSeed ?? Date.now();
      state.seed = activeSeed;
      state.characters = logTimed('Regenerate NPCs from seed', () =>
        generateNPCs(activeSeed),
      );
      state.named = getNamedNpcs();
    });
  },
});
export const { regenerateNpcs, setNearby } = npcsSlice.actions;

export default npcsSlice.reducer;

declare module '@chemicalluck/sim-engine/state/store' {
  interface PresentState {
    npcs: ReturnType<typeof npcsSlice.reducer>;
  }
}
