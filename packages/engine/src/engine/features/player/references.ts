import {
  type NodeRefExtractor,
  type NodeRefRewriter,
  type ReferenceProvider,
  type ReferenceRewriter,
} from '@chemicalluck/engine/lib/validation';

const equipRef: NodeRefExtractor = (node) => {
  if ('kind' in node && node.kind === 'equip' && 'wearable' in node) {
    const { wearable } = node;
    return wearable.id ? [{ namespace: 'wearable', id: wearable.id }] : [];
  }
  return [];
};

export const nodeRefExtractors: NodeRefExtractor[] = [equipRef];

export const referenceProviders: ReferenceProvider[] = [
  {
    file: 'player',
    section: 'world',
    collect: (data) => {
      const { startLocation } = data as { startLocation?: string };
      return startLocation
        ? [
            {
              namespace: 'location',
              id: startLocation,
              source: 'player',
              section: 'world',
            },
          ]
        : [];
    },
  },
];

const equipRewrite: NodeRefRewriter = (node, ns, oldId, newId) => {
  if (
    ns === 'wearable' &&
    'kind' in node &&
    node.kind === 'equip' &&
    'wearable' in node &&
    node.wearable.id === oldId
  ) {
    (node as { wearable: { id: string } }).wearable.id = newId;
    return true;
  }
  return false;
};

export const nodeRefRewriters: NodeRefRewriter[] = [equipRewrite];

export const referenceRewriters: ReferenceRewriter[] = [
  {
    file: 'player',
    rewrite: (data, _rewriteNode, ns, oldId, newId) => {
      if (ns !== 'location') return 0;
      const d = data as { startLocation?: string };
      if (d.startLocation === oldId) {
        d.startLocation = newId;
        return 1;
      }
      return 0;
    },
  },
];
