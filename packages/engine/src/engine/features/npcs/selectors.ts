import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@chemicalluck/engine/state/store';

export const selectNpcs = (state: RootState) => state.present.npcs.characters;

export const selectNamedNpcs = (state: RootState) => state.present.npcs.named;

const selectAllNpcs = createSelector(
  selectNpcs,
  selectNamedNpcs,
  (chars, named) => [...chars, ...named],
);

export const selectNpcById = (npcId: string) =>
  createSelector(
    selectNamedNpcs,
    selectNpcs,
    (named, chars) =>
      named.find((n) => n.id === npcId) ?? chars.find((n) => n.id === npcId),
  );

export const selectNpcsByIds = (ids: string[]) =>
  createSelector(selectAllNpcs, (npcs) =>
    ids.map((id) => npcs.find((npc) => npc.id === id)),
  );

export const selectNpcsKnown = createSelector(
  selectAllNpcs,
  (state: RootState) => state.present.relationships,
  (npcs, relationships) => npcs.filter((npc) => npc.id in relationships),
);

export const selectNpcsNearby = createSelector(
  selectAllNpcs,
  (state: RootState) => state.present.npcs.nearby,
  (npcs, nearby) => npcs.filter((npc) => nearby.includes(npc.id)),
);

export const selectNearbyNpcsCount = createSelector(
  selectNpcsNearby,
  (nearby) => nearby.length,
);
