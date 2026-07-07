import type { ActionGroup } from './action-group.types';
import type { Effect } from './effect.types';
import type { NpcSelection } from './npc-filter.types';

export interface Scene {
  kind: 'scene';
  text: string;
  actions: ActionGroup[];
  completionEffects?: Effect[];
  npcSelection?: NpcSelection;
}
