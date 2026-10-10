import type { NPC } from '@chemicalluck/sim-engine/features/npcs/types';
import type { RootState } from '@chemicalluck/sim-engine/state/store';

/** Whose turn a condition is being evaluated for; `self.*` resolves to it. */
export type EncounterActor =
  | { kind: 'player' }
  | { kind: 'npc'; npcId: string };

let _actor: EncounterActor | null = null;

/** The actor `self.*` expressions resolve to (the player outside any pick). */
export function getEncounterActor(): EncounterActor {
  return _actor ?? { kind: 'player' };
}

/** Run `fn` with `self.*` expressions resolving to `actor`. */
export function withEncounterActor<T>(actor: EncounterActor, fn: () => T): T {
  const previous = _actor;
  _actor = actor;
  try {
    return fn();
  } finally {
    _actor = previous;
  }
}

/** A named or generated NPC by id. */
export function findNpc(state: RootState, npcId: string | null): NPC | null {
  if (!npcId) return null;
  const npcs = state.present.npcs as RootState['present']['npcs'] | undefined;
  return (
    npcs?.named.find((n) => n.id === npcId) ??
    npcs?.characters.find((n) => n.id === npcId) ??
    null
  );
}
