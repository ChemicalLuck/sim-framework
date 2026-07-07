import type { Action } from './action.types';

export interface ActionGroup {
  pretext?: string;
  actions: Action[];
}
