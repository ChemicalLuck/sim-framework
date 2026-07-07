import type { RootState } from '@chemicalluck/engine/state/store';

import { DEFAULT_NPC_RELATIONSHIP } from './slice';

export const selectRelationships = (state: RootState) =>
  state.present.relationships;

export const selectNpcRelationship = (npcId: string) => (state: RootState) =>
  state.present.relationships[npcId] ?? DEFAULT_NPC_RELATIONSHIP;

export const selectNpcKnown = (npcId: string) => (state: RootState) =>
  npcId in state.present.relationships;
