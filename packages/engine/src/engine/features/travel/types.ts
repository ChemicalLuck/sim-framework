import type { ActionGroup } from '@chemicalluck/sim-engine/types/action-group.types';
import type { Condition } from '@chemicalluck/sim-engine/types/condition.types';
import type { BaseEffect } from '@chemicalluck/sim-engine/types/effect.types';

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
  /**
   * Shown on a disabled travel button when `condition` fails (e.g. opening
   * hours). Template text, rendered like `description`. Without it, a location
   * whose condition fails is hidden from travel.
   */
  lockedText?: string;
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
  /**
   * Shown on a disabled travel button when `condition` fails (e.g. service
   * hours). Template text. Without it, the edge is hidden while unavailable.
   */
  lockedText?: string;
  eventIds?: string[];
}

export interface WorldGraph {
  locations: LocationNode[];
  edges: Edge[];
}

export interface TravelEffect extends BaseEffect<'travel'> {
  readonly newLocationId: string;
}

declare module '@chemicalluck/sim-engine/types/effect.types' {
  interface EffectMap {
    travel: TravelEffect;
  }
}
