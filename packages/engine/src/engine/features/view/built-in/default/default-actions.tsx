import { createSelector } from '@reduxjs/toolkit';
import { useMemo } from 'react';
import { actionGroupProviders } from 'virtual:game-extensions';

import { ActionButtonList } from '@chemicalluck/sim-engine/components/action-button-list';
import { renderText } from '@chemicalluck/sim-engine/features/linguistics/lib/template';
import { useTemplateContext } from '@chemicalluck/sim-engine/features/linguistics/use-template-context';
import { selectNpcsNearby } from '@chemicalluck/sim-engine/features/npcs/selectors';
import { selectItemActions } from '@chemicalluck/sim-engine/features/player/selectors';
import { questActions } from '@chemicalluck/sim-engine/features/quests/selectors';
import {
  adjacentTravelActions,
  currentLocationActions,
  edgeTravelActions,
  parentTravelActions,
  renderTravelLockedText,
} from '@chemicalluck/sim-engine/features/travel/selectors';
import type { RootState } from '@chemicalluck/sim-engine/state/store';
import { useEngineSelector } from '@chemicalluck/sim-engine/state/store';
import type { ActionGroup } from '@chemicalluck/sim-engine/types';

const selectActionGroups = createSelector(
  (state: RootState) => state.present.player.locationId,
  (state: RootState) => state,
  (currentId, fullState): { groups: ActionGroup[]; travel: ActionGroup[] } => ({
    groups: [
      ...currentLocationActions(currentId, fullState),
      ...actionGroupProviders.flatMap((p) => p(currentId, fullState)),
      ...questActions(fullState),
      ...selectItemActions(fullState),
    ],
    travel: [
      ...adjacentTravelActions(currentId, fullState),
      ...parentTravelActions(currentId, fullState),
      ...edgeTravelActions(currentId, fullState),
    ],
  }),
);

const DefaultActions = () => {
  const { groups: baseGroups, travel } = useEngineSelector(selectActionGroups);
  const nearby = useEngineSelector(selectNpcsNearby);
  const ctx = useTemplateContext(nearby);
  // Travel lockedText is template text (e.g. opening hours), rendered like
  // location descriptions.
  const groups = useMemo(
    () => [
      ...baseGroups,
      ...renderTravelLockedText(travel, (t) => renderText(t, ctx)),
    ],
    [baseGroups, travel, ctx],
  );

  return groups
    .filter((g) => g.actions.length > 0)
    .map((g, i) => (
      // Action groups are stateless and the whole list is regenerated each
      // render, so an index key is safe — and unlike a text-derived key it can
      // never collide (which previously broke reconciliation, leaving stale
      // duplicate buttons).
      // eslint-disable-next-line react-x/no-array-index-key
      <div key={i} className="flex flex-col gap-1">
        {g.pretext && <p>{g.pretext}</p>}
        <ActionButtonList actions={g.actions} />
      </div>
    ));
};

export default DefaultActions;
