import { createSelector } from '@reduxjs/toolkit';
import { isConditionMet } from '@chemicalluck/sim-engine/lib/conditions';
import { addIndefiniteArticle } from '@chemicalluck/sim-engine/lib/linguistics';
import type { RootState } from '@chemicalluck/sim-engine/state/store';
import type { ActionGroup, BodyAttributes, Equipment } from '@chemicalluck/sim-engine/types';
import type { Wearable } from '@chemicalluck/sim-engine/types/item.types';

import { selectNarrativeVars } from '../linguistics/selectors';
import { describeAppearance } from '../npcs/lib/appearance-config';
import { estimatePlayerSizes, evaluateFit } from '../outfits/lib/fit';
import {
  getEstimatedMetrics,
  getSizeSystems,
} from '../outfits/lib/wearable-config';
import { getLocationById } from '../travel/selectors';

/** Short human note describing how a wearable fits, or '' when it fits / is sizeless. */
function fitNote(
  wearable: Wearable,
  body: BodyAttributes | undefined,
  gender: string | undefined,
): string {
  if (!wearable.sizeSystem || !body) return '';
  const fit = evaluateFit(wearable, body, gender, {
    sizeSystems: getSizeSystems(),
    estimatedMetrics: getEstimatedMetrics(),
  });
  if (fit.sizeless || fit.totalMismatch === 0) return '';
  const off = fit.perDimension.filter((d) => d.mismatch !== 0);
  const allTight = off.every((d) => d.mismatch < 0);
  const allLoose = off.every((d) => d.mismatch > 0);
  if (allTight) return ' (too tight)';
  if (allLoose) return ' (too loose)';
  return ' (ill-fitting)';
}

export const selectCurrentLocation = createSelector(
  (state: RootState) => state.present.player.locationId,
  (currentId) => {
    const location = getLocationById(currentId);
    if (!location)
      throw new Error(`Cannot find current location from ${currentId}`);
    return location;
  },
);

export const selectEquipment = (state: RootState) =>
  state.present.player.equipment;

export const selectPlayerName = (state: RootState) =>
  state.present.player.profile.firstName;

export const selectAppearanceDescription = createSelector(
  (state: RootState) => state.present.player.equipment,
  (state: RootState) => state.present.player.body,
  (state: RootState) => state.present.player.profile.appearance.gender,
  (equipment: Equipment, body, gender) => {
    const wornItems: string[] = [];

    for (const [slot, wearable] of Object.entries(equipment)) {
      if (!wearable) continue;

      // Skip bra if covered by a top layer or a full-body garment
      if (
        slot === 'bra' &&
        (equipment.baselayer ||
          equipment.midlayer ||
          equipment.outerlayer ||
          equipment['full-body'])
      ) {
        continue;
      }

      // Skip pants if covered by legwear or a full-body garment
      if (slot === 'pants' && (equipment.legwear || equipment['full-body'])) {
        continue;
      }

      wornItems.push(
        addIndefiniteArticle(wearable.name) + fitNote(wearable, body, gender),
      );
    }

    if (wornItems.length === 0) return 'You are not wearing anything.';
    if (wornItems.length === 1) return `You are wearing ${wornItems[0]}.`;

    const allButLast = wornItems.slice(0, -1);
    const lastItem = wornItems[wornItems.length - 1];
    return `You are wearing ${allButLast.join(', ')} and ${lastItem}.`;
  },
);

export const selectPlayerDescription = createSelector(
  (state: RootState) => state.present.player.profile,
  (state: RootState) => state.present.player.body,
  selectNarrativeVars,
  (state: RootState) => state.present.linguistics.wordChoices,
  (state: RootState) => state.present.rng.seed,
  (profile, body, vars, wordChoices, seed) =>
    describeAppearance(profile, { body, vars, wordChoices, seed }),
);

export const selectPlayerSizes = createSelector(
  (state: RootState) => state.present.player.body,
  (state: RootState) => state.present.player.profile.appearance.gender,
  (body, gender) =>
    estimatePlayerSizes(body, gender, {
      sizeSystems: getSizeSystems(),
      estimatedMetrics: getEstimatedMetrics(),
    }),
);

export const selectWearables = createSelector(
  (state: RootState) => state.present.containers.player ?? [],
  (items) => items.filter((item) => item.kind === 'wearable'),
);

export const selectItemActions = createSelector(
  (state: RootState) => state.present.containers.player ?? [],
  (state: RootState) => state,
  (items, fullState): ActionGroup[] =>
    items.flatMap((item) =>
      (item.actions ?? [])
        .map((group) => ({
          pretext: group.pretext,
          actions: group.actions.filter((a) =>
            isConditionMet(fullState, a.condition),
          ),
        }))
        .filter((group) => group.actions.length > 0),
    ),
);
