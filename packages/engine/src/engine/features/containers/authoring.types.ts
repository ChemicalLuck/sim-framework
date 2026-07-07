export interface JsonInventoryAddEffect {
  kind: 'inventory';
  operation: 'add';
  itemId: string;
}

export interface JsonContainerInsertEffect {
  kind: 'container';
  operation: 'insert';
  containerId: string;
  itemId: string;
}

declare module '@chemicalluck/sim-engine/data/authoring.types' {
  interface JsonEffectMap {
    inventory_add: JsonInventoryAddEffect;
    container_insert: JsonContainerInsertEffect;
  }
}
