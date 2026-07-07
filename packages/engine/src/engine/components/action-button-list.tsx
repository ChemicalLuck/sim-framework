import type { Action, Effect } from '@sim/engine/types';

import { ActionButton } from './action-button';

interface ActionButtonListProps {
  actions: Action[];
  defaultEffects?: Effect[];
  callback?: () => void;
}

const ActionButtonList = ({
  actions,
  defaultEffects,
  callback,
}: ActionButtonListProps) => {
  if (actions.length === 0) return null;
  return (
    <div className="flex flex-col gap-2.5 items-start">
      {actions.map((action) => (
        <ActionButton
          key={action.text}
          effects={[...(action.effects ?? []), ...(defaultEffects ?? [])]}
          eventIds={action.eventIds}
          callback={callback}
        >
          {action.text}
        </ActionButton>
      ))}
    </div>
  );
};

export { ActionButtonList };
