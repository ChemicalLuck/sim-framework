import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import { getBodyAttributes } from '@chemicalluck/sim-engine/features/npcs/lib/appearance-config';
import { conflictingSlots } from '@chemicalluck/sim-engine/features/outfits/lib/wearable-config';
import type { Player } from '@chemicalluck/sim-engine/features/player/types';
import { makeConfig } from '@chemicalluck/sim-engine/lib/core';
import { clampAdd } from '@chemicalluck/sim-engine/lib/maths';
import type {
  BodyAttributes,
  CharacterProfile,
  Equipment,
  Slot,
  Trait,
  Wearable,
} from '@chemicalluck/sim-engine/types';

export interface PlayerConfig {
  startLocation?: string;
  initialEquipment?: Partial<Equipment>;
  body?: BodyAttributes;
}

const _playerConfig = makeConfig<PlayerConfig>({});

export const configurePlayer = _playerConfig.configure;

function defaultBody(): BodyAttributes {
  return Object.fromEntries(getBodyAttributes().map((a) => [a.id, a.default]));
}

function bodyBounds(attribute: string): [number, number] | undefined {
  const attr = getBodyAttributes().find((a) => a.id === attribute);
  if (!attr) return undefined;
  const { min, max } = attr.distribution.default;
  return [min, max];
}

const DEFAULT_EQUIPMENT: Equipment = {
  hat: null,
  hair: null,
  glasses: null,
  earrings: null,
  necklace: null,
  tie: null,
  scarf: null,
  bra: null,
  baselayer: null,
  midlayer: null,
  outerlayer: null,
  'full-body': null,
  watch: null,
  bracelet: null,
  ring: null,
  gloves: null,
  bag: null,
  belt: null,
  pants: null,
  legwear: null,
  socks: null,
  shoes: null,
  umbrella: null,
};

function makeInitialState(): Player {
  const cfg = _playerConfig.get();
  return {
    id: 'player',
    locationId: cfg.startLocation ?? 'bedroom',
    profile: {
      firstName: '',
      lastName: '',
      profession: 'Student',
      age: 0,
      appearance: {},
    },
    equipment: {
      ...DEFAULT_EQUIPMENT,
      ...(cfg.initialEquipment ?? {}),
    } as Equipment,
    skills: {},
    traits: [],
    body: { ...defaultBody(), ...(cfg.body ?? {}) },
  };
}

export const playerSlice = createSlice({
  name: 'player',
  initialState: makeInitialState,
  reducers: {
    setLocation: (state, action: PayloadAction<string>) => {
      state.locationId = action.payload;
    },

    equipItem: (state, action: PayloadAction<Wearable>) => {
      // Clear any slots that cannot be worn alongside this one (e.g. a
      // full-body dress clears baselayer/legwear, and vice-versa).
      for (const slot of conflictingSlots(action.payload.slot)) {
        state.equipment[slot] = null;
      }
      state.equipment[action.payload.slot] = action.payload;
    },

    unequipItem: (state, action: PayloadAction<Slot>) => {
      state.equipment[action.payload] = null;
    },
    updateSkill: (
      state,
      action: PayloadAction<{ skill: string; value: number }>,
    ) => {
      state.skills[action.payload.skill] = action.payload.value;
    },
    setProfile: (state, action: PayloadAction<Partial<CharacterProfile>>) => {
      state.profile = {
        ...state.profile,
        ...action.payload,
      };
    },
    setBody: (state, action: PayloadAction<BodyAttributes>) => {
      state.body = { ...state.body, ...action.payload };
    },
    adjustBodyAttribute: (
      state,
      action: PayloadAction<{ attribute: string; delta: number }>,
    ) => {
      const { attribute, delta } = action.payload;
      const bounds = bodyBounds(attribute);
      if (!bounds) return;
      const [min, max] = bounds;
      state.body[attribute] = clampAdd(
        state.body[attribute] ?? 0,
        delta,
        min,
        max,
      );
    },
    addTrait: (state, action: PayloadAction<Trait>) => {
      if (!state.traits.includes(action.payload)) {
        state.traits.push(action.payload);
      }
    },
  },
});

export const {
  setLocation,
  equipItem,
  unequipItem,
  setProfile,
  setBody,
  adjustBodyAttribute,
  updateSkill,
  addTrait,
} = playerSlice.actions;

export default playerSlice.reducer;

declare module '@chemicalluck/sim-engine/state/store' {
  interface PresentState {
    player: ReturnType<typeof playerSlice.reducer>;
  }
}
