import type { EncounterAction } from '@chemicalluck/sim-engine/features/encounter/types';
import type { RootState } from '@chemicalluck/sim-engine/state/store';
import type { Action } from '@chemicalluck/sim-engine/types';

/** Presentational additions to an action's rendered label. */
export interface ActionDecoration {
  /** Rendered before the action's text. */
  prefix?: string;
  /** Rendered after the action's text. */
  suffix?: string;
  /** Extra classes for the action's button. */
  className?: string;
}

/**
 * An action decorator, as default-exported (in an array) by an extension's
 * `action-decorators.ts`. Runs for every rendered action (scene, location,
 * script, item, conversation and encounter actions) on each state change;
 * return `null` to leave the action as is. Purely presentational.
 */
export type ActionDecorator = (
  action: Action | EncounterAction,
  state: RootState,
) => ActionDecoration | null;

/** Combine every decorator's output for one action, in decorator order. */
export function decorateAction(
  decorators: readonly ActionDecorator[],
  action: Action | EncounterAction,
  state: RootState,
): ActionDecoration {
  const result: ActionDecoration = {};
  for (const decorate of decorators) {
    const d = decorate(action, state);
    if (!d) continue;
    if (d.prefix) result.prefix = (result.prefix ?? '') + d.prefix;
    if (d.suffix) result.suffix = (result.suffix ?? '') + d.suffix;
    if (d.className)
      result.className = result.className
        ? `${result.className} ${d.className}`
        : d.className;
  }
  return result;
}
