import type {
  ReferenceProvider,
  ReferenceRewriter,
} from '@chemicalluck/engine/lib/validation';

export const referenceProviders: ReferenceProvider[] = [
  {
    file: 'minimap',
    section: 'world',
    collect: (data) => {
      const { nodes } = data as { nodes?: Record<string, unknown> };
      return Object.keys(nodes ?? {}).map((id) => ({
        namespace: 'location',
        id,
        source: 'minimap',
        section: 'world',
      }));
    },
  },
];

export const referenceRewriters: ReferenceRewriter[] = [
  {
    file: 'minimap',
    rewrite: (data, _rewriteNode, ns, oldId, newId) => {
      if (ns !== 'location' || oldId === newId) return 0;
      const { nodes } = data as { nodes?: Record<string, unknown> };
      if (!nodes || !(oldId in nodes)) return 0;
      // Rebuild preserving insertion order, swapping the renamed key in place.
      const rebuilt: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(nodes)) {
        rebuilt[key === oldId ? newId : key] = value;
      }
      (data as { nodes?: Record<string, unknown> }).nodes = rebuilt;
      return 1;
    },
  },
];
