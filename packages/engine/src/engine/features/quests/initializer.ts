import type { EngineStore } from '@sim/engine/state/store';

import { loadQuests } from './slice';
import type { Quest } from './types';

declare module '@sim/engine/data' {
  interface ContentExtensions {
    quests: Quest[];
  }
}

let _quests: Quest[] | undefined;

export function registerInitialQuests(quests: Quest[]): void {
  _quests = quests;
}

export default function (store: EngineStore) {
  if (_quests?.length) store.dispatch(loadQuests(_quests));
}
