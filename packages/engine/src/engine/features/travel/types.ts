import type { ActionGroup } from '@sim/engine/types/action-group.types';
import type { Condition } from '@sim/engine/types/condition.types';
import type { BaseEffect } from '@sim/engine/types/effect.types';

export type TravelType = 'walk' | 'bus' | 'train' | 'drive';

export type LocationType = 'exterior' | 'interior';

export interface NearbyScheduleSlot {
  /** Inclusive start hour (0–23) */
  after: number;
  /** Inclusive end hour (0–23) */
  before: number;
  min: number;
  max: number;
}

export interface NearbyConditions {
  professions?: string[];
  minAge?: number;
  maxAge?: number;
  appearance?: Record<string, string>;
  min?: number;
  max?: number;
  /** Time-of-day count overrides. First matching slot wins; falls back to min/max. */
  schedule?: NearbyScheduleSlot[];
}

export interface LocationNode {
  id: string;
  name: string;
  kind: LocationType;
  parent?: string;
  condition?: Condition;
  nearby?: NearbyConditions;
  description?: string;
  entryText?: string;
  actions?: ActionGroup[];
}

export interface Edge {
  nodes: [string, string];
  weight: number;
  kind: TravelType;
  cost?: number;
  condition?: Condition;
  eventIds?: string[];
}

export interface WorldGraph {
  locations: LocationNode[];
  edges: Edge[];
}

export interface TravelEffect extends BaseEffect<'travel'> {
  readonly newLocationId: string;
}

declare module '@sim/engine/types/effect.types' {
  interface EffectMap {
    travel: TravelEffect;
  }
}
