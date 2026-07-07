import {
  type IdSource,
  type NodeRefExtractor,
  type NodeRefRewriter,
  type RefRecord,
  type ReferenceProvider,
  type ReferenceRewriter,
  collectActionGroupRefs,
  rewriteActionGroupRefs,
} from '@chemicalluck/sim-engine/lib/validation';

import type { Edge, LocationNode } from './types';

export const idSources: IdSource[] = [
  {
    namespace: 'location',
    file: 'locations',
    select: (data) => (data as LocationNode[]).map((l) => l.id),
  },
];

const travelRef: NodeRefExtractor = (node) => {
  if ('kind' in node && node.kind === 'travel' && 'newLocationId' in node) {
    return [{ namespace: 'location', id: node.newLocationId }];
  }
  return [];
};

export const nodeRefExtractors: NodeRefExtractor[] = [travelRef];

export const referenceProviders: ReferenceProvider[] = [
  {
    file: 'locations',
    section: 'locations',
    collect: (data, extract) =>
      (data as LocationNode[]).flatMap((loc) => {
        const records: RefRecord[] = collectActionGroupRefs(
          loc.actions,
          `loc:${loc.id}`,
          'locations',
          extract,
        );
        if (loc.parent) {
          records.push({
            namespace: 'location',
            id: loc.parent,
            source: `loc:${loc.id}`,
            section: 'locations',
          });
        }
        return records;
      }),
  },
  {
    file: 'edges',
    section: 'world',
    collect: (data) =>
      (data as Edge[]).flatMap((edge) =>
        edge.nodes.map((node) => ({
          namespace: 'location',
          id: node,
          source: 'edges',
          section: 'world',
        })),
      ),
  },
];

const travelRewrite: NodeRefRewriter = (node, ns, oldId, newId) => {
  if (
    ns === 'location' &&
    'kind' in node &&
    node.kind === 'travel' &&
    'newLocationId' in node &&
    node.newLocationId === oldId
  ) {
    (node as { newLocationId: string }).newLocationId = newId;
    return true;
  }
  return false;
};

export const nodeRefRewriters: NodeRefRewriter[] = [travelRewrite];

export const referenceRewriters: ReferenceRewriter[] = [
  {
    file: 'locations',
    rewrite: (data, rewriteNode, ns, oldId, newId) => {
      let count = 0;
      for (const loc of data as LocationNode[]) {
        count += rewriteActionGroupRefs(
          loc.actions,
          rewriteNode,
          ns,
          oldId,
          newId,
        );
        if (ns === 'location' && loc.parent === oldId) {
          loc.parent = newId;
          count++;
        }
      }
      return count;
    },
  },
  {
    file: 'edges',
    rewrite: (data, _rewriteNode, ns, oldId, newId) => {
      if (ns !== 'location') return 0;
      let count = 0;
      for (const edge of data as Edge[]) {
        for (let i = 0; i < edge.nodes.length; i++) {
          if (edge.nodes[i] === oldId) {
            edge.nodes[i] = newId;
            count++;
          }
        }
      }
      return count;
    },
  },
];
