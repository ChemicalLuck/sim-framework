import { shallowEqual } from 'react-redux';
import { actionDecorators } from 'virtual:game-extensions';

import type { EncounterAction } from '@chemicalluck/sim-engine/features/encounter/types';
import { useEngineSelector } from '@chemicalluck/sim-engine/state/store';
import type { Action } from '@chemicalluck/sim-engine/types';

import { type ActionDecoration, decorateAction } from './lib/action-decorators';

/**
 * Each action's decoration from the game's `action-decorators.ts` extensions,
 * recomputed on state changes. Index-aligned with `actions`.
 */
export function useActionDecorations(
  actions: readonly (Action | EncounterAction)[],
): ActionDecoration[] {
  // Flattened to strings so shallowEqual keeps renders stable.
  const flat = useEngineSelector(
    (state) =>
      actionDecorators.length === 0
        ? []
        : actions.flatMap((a) => {
            const d = decorateAction(actionDecorators, a, state);
            return [d.prefix ?? '', d.suffix ?? '', d.className ?? ''];
          }),
    shallowEqual,
  );
  return actions.map((_, i) => ({
    prefix: flat[i * 3] || undefined,
    suffix: flat[i * 3 + 1] || undefined,
    className: flat[i * 3 + 2] || undefined,
  }));
}
