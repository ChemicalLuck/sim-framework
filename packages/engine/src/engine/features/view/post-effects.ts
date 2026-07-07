import {
  type EffectContext,
  dispatchWithGroup,
} from '@sim/engine/features/core/types';

import { setDescription } from './slice';

export function handleResetDescription({
  dispatch,
  group,
  prevState,
  newState,
}: EffectContext) {
  if (!newState) throw new Error('uncallable without newState');
  if (prevState.present.view.description !== newState.present.view.description)
    return;
  dispatchWithGroup(dispatch, setDescription(''), group);
}

export default [handleResetDescription];
