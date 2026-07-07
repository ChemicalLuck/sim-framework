import { toast } from 'sonner';
import {
  type EffectContext,
  dispatchWithGroup,
} from '@sim/engine/features/core/types';

import { addMilestone } from './slice';
import type { MilestoneEffect } from './types';

export function handleMilestoneEffect(
  effect: MilestoneEffect,
  { dispatch, group, prevState }: EffectContext,
) {
  dispatchWithGroup(dispatch, addMilestone(effect.milestoneId), group);
  const milestone = prevState.present.milestones.definitions.find(
    (m) => m.id === effect.milestoneId,
  );
  if (milestone) {
    toast(`New Milestone! ${milestone.title}`);
  }
}

export default { milestone: handleMilestoneEffect };
