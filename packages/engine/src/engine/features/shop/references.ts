import {
  type IdSource,
  type NodeRefExtractor,
  type NodeRefRewriter,
  type ReferenceProvider,
  type ReferenceRewriter,
  flattenConditions,
} from '@chemicalluck/sim-engine/lib/validation';

import type { JsonShop, ShopGate } from './authoring.types';

export const idSources: IdSource[] = [
  {
    namespace: 'shop',
    file: 'shops',
    select: (data) => (data as JsonShop[]).map((s) => s.id),
  },
];

export const referenceProviders: ReferenceProvider[] = [
  {
    file: 'shops',
    section: 'shops',
    collect: (data, extract) =>
      (data as JsonShop[]).flatMap((shop) => {
        const tag = { source: `shop:${shop.id}`, section: 'shops' };
        const conditionRefs = (gate: ShopGate) =>
          flattenConditions(gate.condition).flatMap((c) =>
            extract(c).map((ref) => ({ ...ref, ...tag })),
          );
        return shop.tabs.flatMap((tab) => [
          ...conditionRefs(tab),
          ...tab.items.flatMap((entry) => {
            const ref =
              entry.kind === 'item'
                ? { namespace: 'item', id: entry.itemId }
                : entry.kind === 'wearable'
                  ? { namespace: 'wearable', id: entry.wearableId }
                  : { namespace: 'wearableTemplate', id: entry.templateId };
            return [{ ...ref, ...tag }, ...conditionRefs(entry)];
          }),
        ]);
      }),
  },
];

const shopViewRef: NodeRefExtractor = (node) => {
  if ('kind' in node && node.kind === 'view' && 'shopId' in node) {
    return [{ namespace: 'shop', id: node.shopId }];
  }
  return [];
};

export const nodeRefExtractors: NodeRefExtractor[] = [shopViewRef];

const shopViewRewrite: NodeRefRewriter = (node, ns, oldId, newId) => {
  if (
    ns === 'shop' &&
    'kind' in node &&
    node.kind === 'view' &&
    'shopId' in node &&
    node.shopId === oldId
  ) {
    (node as { shopId: string }).shopId = newId;
    return true;
  }
  return false;
};

export const nodeRefRewriters: NodeRefRewriter[] = [shopViewRewrite];

export const referenceRewriters: ReferenceRewriter[] = [
  {
    file: 'shops',
    rewrite: (data, rewriteNode, ns, oldId, newId) => {
      let count = 0;
      const rewriteGate = (gate: ShopGate) => {
        for (const c of flattenConditions(gate.condition))
          if (rewriteNode(c)) count++;
      };
      for (const shop of data as JsonShop[]) {
        for (const tab of shop.tabs) {
          rewriteGate(tab);
          for (const entry of tab.items) {
            rewriteGate(entry);
            if (entry.kind === 'item') {
              if (ns === 'item' && entry.itemId === oldId) {
                entry.itemId = newId;
                count++;
              }
            } else if (entry.kind === 'wearable') {
              if (ns === 'wearable' && entry.wearableId === oldId) {
                entry.wearableId = newId;
                count++;
              }
            } else if (
              ns === 'wearableTemplate' &&
              entry.templateId === oldId
            ) {
              entry.templateId = newId;
              count++;
            }
          }
        }
      }
      return count;
    },
  },
];
