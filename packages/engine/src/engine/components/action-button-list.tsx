import { shallowEqual } from 'react-redux';

import { isConditionMet } from '@chemicalluck/sim-engine/lib/conditions';
import { cn } from '@chemicalluck/sim-engine/lib/css';
import { useEngineSelector } from '@chemicalluck/sim-engine/state/store';
import type { Action, Effect } from '@chemicalluck/sim-engine/types';

import { ActionButton } from './action-button';

// Below md each action is a full-width, 44px-tall row so it is easy to tap.
const TOUCH_ROW =
  'max-md:-mx-2 max-md:min-h-11 max-md:w-[calc(100%+1rem)] max-md:rounded-md max-md:px-2 max-md:text-left max-md:text-base max-md:active:bg-accent';

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
    <div className="flex flex-col items-start max-md:gap-0.5 md:gap-2.5">
      {actions.map((action, i) => {
        if (met[i]) {
          return (
            <ActionButton
              key={action.text}
              effects={[...(action.effects ?? []), ...(defaultEffects ?? [])]}
              eventIds={action.eventIds}
              callback={callback}
              className={TOUCH_ROW}
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
            className={cn(
              'flex items-center gap-2 text-sm font-medium text-primary opacity-40',
              TOUCH_ROW,
            )}
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
