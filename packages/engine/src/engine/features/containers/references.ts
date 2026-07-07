import type {
  NodeRefExtractor,
  NodeRefRewriter,
} from '@chemicalluck/sim-engine/lib/validation';

// Authored inventory/container effects reference an item by id. (Adds use
// `itemId`; removes carry the bare item `id`.)
const inventoryRef: NodeRefExtractor = (node) => {
  if (!('kind' in node) || node.kind !== 'inventory') return [];
  if (node.operation === 'add' && 'itemId' in node) {
    return [{ namespace: 'item', id: node.itemId }];
  }
  if (
    node.operation === 'remove' &&
    'id' in node &&
    typeof node.id === 'string'
  ) {
    return [{ namespace: 'item', id: node.id }];
  }
  return [];
};

const containerRef: NodeRefExtractor = (node) => {
  if (
    'kind' in node &&
    node.kind === 'container' &&
    'itemId' in node &&
    typeof node.itemId === 'string'
  ) {
    return [{ namespace: 'item', id: node.itemId }];
  }
  return [];
};

export const nodeRefExtractors: NodeRefExtractor[] = [
  inventoryRef,
  containerRef,
];

const inventoryRewrite: NodeRefRewriter = (node, ns, oldId, newId) => {
  if (ns !== 'item' || !('kind' in node) || node.kind !== 'inventory')
    return false;
  if (node.operation === 'add' && 'itemId' in node && node.itemId === oldId) {
    (node as { itemId: string }).itemId = newId;
    return true;
  }
  if (
    node.operation === 'remove' &&
    'id' in node &&
    typeof node.id === 'string' &&
    node.id === oldId
  ) {
    (node as { id: string }).id = newId;
    return true;
  }
  return false;
};

const containerRewrite: NodeRefRewriter = (node, ns, oldId, newId) => {
  if (
    ns === 'item' &&
    'kind' in node &&
    node.kind === 'container' &&
    'itemId' in node &&
    typeof node.itemId === 'string' &&
    node.itemId === oldId
  ) {
    (node as { itemId: string }).itemId = newId;
    return true;
  }
  return false;
};

export const nodeRefRewriters: NodeRefRewriter[] = [
  inventoryRewrite,
  containerRewrite,
];
