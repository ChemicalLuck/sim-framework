import type { EngineStore } from '@chemicalluck/engine/state/store';

import { loadMilestones } from './slice';
import type { Milestone } from './types';

declare module '@chemicalluck/engine/data' {
  interface ContentExtensions {
    milestones: Milestone[];
  }
}

let _milestones: Milestone[] | undefined;

export function registerInitialMilestones(milestones: Milestone[]): void {
  _milestones = milestones;
}

export default function (store: EngineStore) {
  if (_milestones?.length) store.dispatch(loadMilestones(_milestones));
}
