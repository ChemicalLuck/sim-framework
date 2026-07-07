import type { RootState } from '@chemicalluck/sim-engine/state/store';

export interface ContainerHasItemsCondition {
  kind: 'container_has_items';
  containerId: string;
}

export interface ContainerHasDirtyItemsCondition {
  kind: 'container_has_dirty_items';
  containerId: string;
}

export interface ItemExpr {
  kind: 'item';
}

declare module '@chemicalluck/sim-engine/types/condition.types' {
  interface ConditionMap {
    container_has_items: ContainerHasItemsCondition;
    container_has_dirty_items: ContainerHasDirtyItemsCondition;
  }
  interface ExprMap {
    item: ItemExpr;
  }
}

export const conditionParsers = [
  (
    id: string,
  ): ContainerHasItemsCondition | ContainerHasDirtyItemsCondition | null => {
    if (!id.startsWith('container.')) return null;
    const rest = id.slice('container.'.length);
    const lastDot = rest.lastIndexOf('.');
    if (lastDot === -1) throw new Error(`Invalid container condition: ${id}`);
    const containerId = rest.slice(0, lastDot);
    const predicate = rest.slice(lastDot + 1);
    if (predicate === 'has_items')
      return { kind: 'container_has_items', containerId };
    if (predicate === 'has_dirty')
      return { kind: 'container_has_dirty_items', containerId };
    throw new Error(`Unknown container predicate: ${predicate}`);
  },
];

export const conditionSerializers = {
  container_has_items: (c: ContainerHasItemsCondition) =>
    `container.${c.containerId}.has_items`,
  container_has_dirty_items: (c: ContainerHasDirtyItemsCondition) =>
    `container.${c.containerId}.has_dirty`,
};

export const exprKinds = ['item'];

export const exprParsers = [
  (id: string): ItemExpr | null => {
    if (id !== 'item') return null;
    return { kind: 'item' };
  },
];

export const exprEvaluators = {
  item: (_e: ItemExpr, state: RootState): number =>
    state.present.containers.player?.length ?? 0,
};

export const exprSerializers = {
  item: () => 'item',
};

export default {
  container_has_items: (
    cond: ContainerHasItemsCondition,
    state: RootState,
  ): boolean => (state.present.containers[cond.containerId]?.length ?? 0) > 0,

  container_has_dirty_items: (
    cond: ContainerHasDirtyItemsCondition,
    state: RootState,
  ): boolean => {
    const items = state.present.containers[cond.containerId] ?? [];
    const clothing = state.present.clothing;
    return items.some(
      (i) =>
        i.kind === 'wearable' &&
        i.instanceId != null &&
        (clothing[i.instanceId]?.isDirty ?? false),
    );
  },
};
