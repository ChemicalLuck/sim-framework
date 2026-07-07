import { selectItemActions } from '@chemicalluck/engine/features/player/selectors';
import { useEngineSelector } from '@chemicalluck/engine/state/store';

import { ActionButtonList } from './action-button-list';

export function ItemActionsButtonsList() {
  const groups = useEngineSelector(selectItemActions);
  return (
    <>
      {groups.map((group, i) => (
        // eslint-disable-next-line react-x/no-array-index-key
        <div key={i} className="flex flex-col gap-1">
          {group.pretext && <p>{group.pretext}</p>}
          <ActionButtonList actions={group.actions} />
        </div>
      ))}
    </>
  );
}
