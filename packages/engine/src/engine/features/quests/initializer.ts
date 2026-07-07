import type { EngineStore } from '@chemicalluck/engine/state/store';

import { loadQuests } from './slice';
import type { Quest } from './types';

declare module '@chemicalluck/engine/data' {
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
