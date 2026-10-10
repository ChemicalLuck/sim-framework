import type { EffectContext } from '@chemicalluck/sim-engine/features/core/types';
import { selectPlayerName } from '@chemicalluck/sim-engine/features/player/selectors';
import { selectTimestamp } from '@chemicalluck/sim-engine/features/time/selectors';
import { GlobalLogger } from '@chemicalluck/sim-engine/lib/logger';
import type { EngineThunk } from '@chemicalluck/sim-engine/state/store';

import { createAutosave, flushPersist } from './saves';
import { selectIronman } from './selectors';
import { getRunOptions } from './slice';
import type { AutosaveEffect } from './types';

const logger = GlobalLogger.child('save');

/**
 * Waits for the current effect batch to finish and be persisted, then
 * snapshots it. Ironman runs keep only their single continuous autosave.
 */
export const autosaveThunk =
  (effect: AutosaveEffect): EngineThunk<Promise<void>> =>
  async (_dispatch, getState) => {
    // Let the rest of the batch (and post-effects) apply first.
    await Promise.resolve();
    const options = getRunOptions();
    if (options.ironman === 'always' || selectIronman(getState())) return;
    await flushPersist();
    const state = getState();
    const slot = createAutosave({
      label: effect.label,
      keep: effect.keep,
      rotate: options.autosave.rotate,
      characterName: selectPlayerName(state),
      inGameTime: new Date(selectTimestamp(state)).toLocaleString(),
    });
    logger.debug('Autosaved:', slot?.name);
  };

export function handleAutosaveEffect(
  effect: AutosaveEffect,
  { dispatch }: EffectContext,
) {
  void dispatch(autosaveThunk(effect));
}

export default { autosave: handleAutosaveEffect };
