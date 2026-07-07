import {
  type EffectContext,
  dispatchWithGroup,
} from '@sim/engine/features/core/types';
import { type RNG, worldRng } from '@sim/engine/features/rng/lib/rng';
import { GlobalLogger } from '@sim/engine/lib/logger';
import type { Character } from '@sim/engine/types/character.types';
import type { NpcFilter, NpcSelection } from '@sim/engine/types/npc-filter.types';

import { type ViewState, setDescription, setView } from './slice';
import type { DescEffect, ViewEffect } from './types';

const logger = GlobalLogger.child('view');

function npcMatchesFilter(npc: Character, filter: NpcFilter): boolean {
  switch (filter.kind) {
    case 'appearance':
      return npc.profile.appearance[filter.featureId] === filter.value;
    case 'profession':
      return npc.profile.profession === filter.profession;
    case 'trait':
      return npc.traits.includes(filter.trait);
  }
}

export function applyNpcSelection(
  selection: NpcSelection | undefined,
  nearby: Character[],
  rng: RNG = worldRng,
): string[] | null {
  if (!selection) return [];
  if ('npcIds' in selection) return selection.npcIds;
  return resolveNpcIds(nearby, selection.npcCount, selection.npcFilters, rng);
}

export function resolveNpcIds(
  nearby: Character[],
  count: number,
  filters?: NpcFilter[][],
  rng: RNG = worldRng,
): string[] | null {
  if (count === 0) return [];
  const selected: string[] = [];
  const used = new Set<string>();
  for (let slot = 0; slot < count; slot++) {
    const slotFilters = filters?.[slot] ?? [];
    const eligible = nearby.filter(
      (npc) =>
        !used.has(npc.id) && slotFilters.every((f) => npcMatchesFilter(npc, f)),
    );
    if (!eligible.length) return null;
    const picked = eligible[Math.floor(rng.next() * eligible.length)];
    selected.push(picked.id);
    used.add(picked.id);
  }
  return selected;
}

export function handleViewEffect(
  effect: ViewEffect,
  { dispatch, group, prevState }: EffectContext,
) {
  const { characters, named, nearby: nearbyIds } = prevState.present.npcs;
  const nearbyNpcs = [...named, ...characters].filter((npc) =>
    nearbyIds.includes(npc.id),
  );

  const rawProps = effect.props as Record<string, unknown>;

  // Use pre-provided npcIds if already present and non-empty
  const existingNpcIds = rawProps.npcIds;
  if (Array.isArray(existingNpcIds) && existingNpcIds.length > 0) {
    dispatchWithGroup(dispatch, setView(effect), group);
    return;
  }

  // Resolve NPC selection from any prop that exposes an npcSelection field
  for (const val of Object.values(rawProps)) {
    if (!val || typeof val !== 'object' || !('npcSelection' in val)) continue;
    const entity = val as { npcSelection?: NpcSelection };
    const npcIds = applyNpcSelection(entity.npcSelection, nearbyNpcs);
    if (npcIds === null) {
      logger.warn(
        `[${effect.activeViewId}] Blocked: insufficient nearby NPCs for npcSelection`,
      );
      return;
    }
    dispatchWithGroup(
      dispatch,
      setView({
        activeViewId: effect.activeViewId,
        props: { ...rawProps, npcIds },
      } as ViewState),
      group,
    );
    return;
  }

  logger.debug('Switching view to:', effect.activeViewId);
  dispatchWithGroup(dispatch, setView(effect), group);
}

export function handleDescEffect(
  effect: DescEffect,
  { dispatch, group }: EffectContext,
) {
  dispatchWithGroup(dispatch, setDescription(effect.text), group);
}

export default { view: handleViewEffect, desc: handleDescEffect };
