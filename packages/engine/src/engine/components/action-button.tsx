import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';
import { getEvents } from '@chemicalluck/sim-engine/features/events/lib';
import { worldRng } from '@chemicalluck/sim-engine/features/rng/lib/rng';
import { applyNpcSelection } from '@chemicalluck/sim-engine/features/view/effects';
import { setView } from '@chemicalluck/sim-engine/features/view/slice';
import { useKeybind } from '@chemicalluck/sim-engine/hooks/use-keybind';
import { isConditionMet } from '@chemicalluck/sim-engine/lib/conditions';
import { cn } from '@chemicalluck/sim-engine/lib/css';
import { useEngineDispatch, useEngineStore } from '@chemicalluck/sim-engine/state/store';
import { processEffects } from '@chemicalluck/sim-engine/state/thunks';
import type { Effect } from '@chemicalluck/sim-engine/types';

import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface ActionButtonProps {
  effects: Effect[];
  eventIds?: string[];
  callback?: () => void;
}

function ActionButton({
  className,
  effects,
  eventIds,
  callback,
  children,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  ActionButtonProps & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';
  const dispatch = useEngineDispatch();
  const store = useEngineStore();

  const handleClick = () => {
    const state = store.getState();
    const eventIdSet = new Set(eventIds ?? []);
    const eligible = getEvents().filter(
      (ev) =>
        eventIdSet.has(ev.id) &&
        (!ev.condition || isConditionMet(state, ev.condition)) &&
        worldRng.next() < ev.probability,
    );

    if (eligible.length) {
      const chosen = eligible[Math.floor(worldRng.next() * eligible.length)];
      const { characters, named, nearby: nearbyIds } = state.present.npcs;
      const nearbyNpcs = [...named, ...characters].filter((npc) =>
        nearbyIds.includes(npc.id),
      );
      const npcIds = applyNpcSelection(chosen.script.npcSelection, nearbyNpcs);
      if (npcIds !== null) {
        dispatch(
          setView({
            activeViewId: 'ScriptView',
            props: { script: chosen.script, npcIds },
          }),
        );
      }
      if (chosen.cancels === false) {
        dispatch(processEffects(effects));
      }
    } else {
      dispatch(processEffects(effects));
    }

    callback?.();
  };

  const keybind = useKeybind(handleClick);

  const tooltipContent = effects
    .map((e) => {
      switch (e.kind) {
        case 'sleep':
          return 'Energy++';
        case 'money':
          return 'Money--';
        case 'needs':
          return `${e.need}${e.delta >= 0 ? '++' : '--'}`;
        default:
          return null;
      }
    })
    .filter((s) => s !== null)
    .join(', ');

  return (
    <Tooltip disableHoverableContent={true}>
      <TooltipTrigger asChild>
        <Comp
          data-slot="button"
          className={cn(
            'group flex items-center gap-2 text-sm font-medium cursor-pointer',
            'text-primary transition-all duration-150',
            'hover:text-primary/75',
            'disabled:pointer-events-none disabled:opacity-40',
            className,
          )}
          onClick={handleClick}
          {...props}
        >
          <span
            className="text-primary/40 transition-transform duration-150 group-hover:translate-x-0.5 select-none"
            aria-hidden="true"
          >
            {keybind} ›
          </span>
          {children}
        </Comp>
      </TooltipTrigger>
      {tooltipContent && <TooltipContent>{tooltipContent}</TooltipContent>}
    </Tooltip>
  );
}

export { ActionButton };
