import { shallowEqual } from 'react-redux';

import { isConditionMet } from '@chemicalluck/sim-engine/lib/conditions';
import { useEngineSelector } from '@chemicalluck/sim-engine/state/store';
import type { Action, Effect } from '@chemicalluck/sim-engine/types';

import { ActionButton } from './action-button';

interface ActionButtonListProps {
  actions: Action[];
  defaultEffects?: Effect[];
  callback?: () => void;
}

/**
 * Renders a list of actions. Actions whose `condition` isn't met are hidden,
 * or shown disabled with their `lockedText` when one is set.
 */
const ActionButtonList = ({
  actions,
  defaultEffects,
  callback,
}: ActionButtonListProps) => {
  const met = useEngineSelector(
    (state) => actions.map((a) => isConditionMet(state, a.condition)),
    shallowEqual,
  );
  const visible = actions.filter((a, i) => met[i] || a.lockedText);
  if (visible.length === 0) return null;
  return (
    <div className="flex flex-col gap-2.5 items-start">
      {actions.map((action, i) => {
        if (met[i]) {
          return (
            <ActionButton
              key={action.text}
              effects={[...(action.effects ?? []), ...(defaultEffects ?? [])]}
              eventIds={action.eventIds}
              callback={callback}
            >
              {action.text}
            </ActionButton>
          );
        }
        if (!action.lockedText) return null;
        return (
          <button
            key={action.text}
            type="button"
            disabled
            className="flex items-center gap-2 text-sm font-medium text-primary opacity-40"
          >
            <span className="select-none" aria-hidden="true">
              ›
            </span>
            {action.text}
            <span className="text-xs italic">({action.lockedText})</span>
          </button>
        );
      })}
    </div>
  );
};

export { ActionButtonList };
