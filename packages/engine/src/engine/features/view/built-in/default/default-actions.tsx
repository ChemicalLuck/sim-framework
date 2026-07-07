import { createSelector } from '@reduxjs/toolkit';
import { actionGroupProviders } from 'virtual:game-extensions';
import { ActionButtonList } from '@sim/engine/components/action-button-list';
import { selectItemActions } from '@sim/engine/features/player/selectors';
import { questActions } from '@sim/engine/features/quests/selectors';
import {
  adjacentTravelActions,
  currentLocationActions,
  edgeTravelActions,
  parentTravelActions,
} from '@sim/engine/features/travel/selectors';
import type { RootState } from '@sim/engine/state/store';
import { useEngineSelector } from '@sim/engine/state/store';
import type { ActionGroup } from '@sim/engine/types';

const selectActionGroups = createSelector(
  (state: RootState) => state.present.player.locationId,
  (state: RootState) => state,
  (currentId, fullState): ActionGroup[] => [
    ...currentLocationActions(currentId, fullState),
    ...actionGroupProviders.flatMap((p) => p(currentId, fullState)),
    ...questActions(fullState),
    ...selectItemActions(fullState),
    ...adjacentTravelActions(currentId, fullState),
    ...parentTravelActions(currentId),
    ...edgeTravelActions(currentId, fullState),
  ],
);

const DefaultActions = () => {
  const groups = useEngineSelector(selectActionGroups);

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
