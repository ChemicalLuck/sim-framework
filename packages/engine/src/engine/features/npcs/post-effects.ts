import {
  type EffectContext,
  dispatchWithGroup,
} from '@chemicalluck/sim-engine/features/core/types';
import { getNamedNpcDefs } from '@chemicalluck/sim-engine/features/npcs/lib/named-npcs';
import { worldRng } from '@chemicalluck/sim-engine/features/rng/lib/rng';
import { getLocationById } from '@chemicalluck/sim-engine/features/travel/selectors';

import { setNearby } from './slice';

export function handleUpdateNearby({
  dispatch,
  group,
  newState,
}: EffectContext) {
  if (!newState) throw new Error('uncallable without newState');
  const { nearby: oldNearby, characters } = newState.present.npcs;

  let nearby: string[] = [];
  const { locationId } = newState.present.player;
  const location = getLocationById(locationId);
  if (location?.nearby) {
    const { professions, minAge, maxAge, appearance, min, max, schedule } =
      location.nearby;
    const filtered = characters.filter(
      (npc) =>
        (!professions || professions.includes(npc.profile.profession)) &&
        (minAge === undefined || npc.profile.age >= minAge) &&
        (maxAge === undefined || npc.profile.age <= maxAge) &&
        (!appearance ||
          Object.entries(appearance).every(
            ([fid, val]) => npc.profile.appearance[fid] === val,
          )) &&
        !oldNearby.includes(npc.id),
    );
    const hour = new Date(newState.present.time.timestamp).getHours();
    const slot = schedule?.find(
      (slot) => hour >= slot.after && hour <= slot.before,
    );
    const countMin = slot?.min ?? min;
    const countMax = slot?.max ?? max;
    const count =
      countMin !== undefined && countMax !== undefined
        ? countMin + Math.floor(worldRng.next() * (countMax - countMin + 1))
        : filtered.length;
    nearby = filtered.slice(0, count).map((npc) => npc.id);
  }

  const hour = new Date(newState.present.time.timestamp).getHours();
  for (const def of getNamedNpcDefs()) {
    if (!def.schedule?.length) continue;
    for (const entry of def.schedule) {
      if (entry.locationId !== locationId) continue;
      const inWindow =
        entry.after <= entry.before
          ? hour >= entry.after && hour <= entry.before
          : hour >= entry.after || hour <= entry.before;
      if (inWindow && !nearby.includes(def.id)) nearby.push(def.id);
    }
  }

  dispatchWithGroup(dispatch, setNearby(nearby), group);
}

export default [handleUpdateNearby];
