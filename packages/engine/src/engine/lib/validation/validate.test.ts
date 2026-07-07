import { describe, expect, it } from 'vitest';

import {
  type ReferenceContributions,
  collectReferences,
  namespaceOf,
  reverseReferences,
  rewriteReferences,
  validateReferences,
} from './index';

// Synthetic contributions standing in for what features provide. Two id
// namespaces ('item', 'scene'), one content walker over a fake 'pages' file,
// and one extractor that reads `{ kind: 'use', itemId }` nodes.
const contributions: ReferenceContributions = {
  idSources: [
    {
      namespace: 'item',
      file: 'items',
      select: (data) => (data as { id: string }[]).map((i) => i.id),
    },
    {
      namespace: 'scene',
      file: 'scenes',
      select: (data) => (data as { id: string }[]).map((s) => s.id),
    },
  ],
  nodeRefExtractors: [
    (node) => {
      const n = node as { kind?: string; itemId?: string };
      return n.kind === 'use' && n.itemId
        ? [{ namespace: 'item', id: n.itemId }]
        : [];
    },
  ],
  referenceProviders: [
    {
      file: 'pages',
      section: 'pages',
      collect: (data, extract) =>
        (data as { id: string; effects: unknown[] }[]).flatMap((page) =>
          page.effects.flatMap((fx) =>
            extract(fx as never).map((ref) => ({
              ...ref,
              source: `page:${page.id}`,
              section: 'pages',
            })),
          ),
        ),
    },
  ],
  nodeRefRewriters: [
    (node, ns, oldId, newId) => {
      const n = node as { kind?: string; itemId?: string };
      if (ns === 'item' && n.kind === 'use' && n.itemId === oldId) {
        n.itemId = newId;
        return true;
      }
      return false;
    },
  ],
  referenceRewriters: [
    {
      file: 'pages',
      rewrite: (data, rewriteNode) => {
        let count = 0;
        for (const page of data as { effects: unknown[] }[]) {
          for (const fx of page.effects) {
            if (rewriteNode(fx as never)) count++;
          }
        }
        return count;
      },
    },
  ],
};

const dataByFile = {
  items: [{ id: 'apple' }],
  scenes: [{ id: 'cafe' }],
  pages: [
    { id: 'p1', effects: [{ kind: 'use', itemId: 'apple' }] },
    { id: 'p2', effects: [{ kind: 'use', itemId: 'ghost' }] },
  ],
};

describe('validateReferences', () => {
  it('flags references to unknown ids', () => {
    const issues = validateReferences(dataByFile, contributions);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ section: 'pages', source: 'page:p2' });
    expect(issues[0].message).toContain('ghost');
  });

  it('skips namespaces that have no id source present', () => {
    const issues = validateReferences(
      { pages: dataByFile.pages },
      contributions,
    );
    expect(issues).toEqual([]);
  });
});

describe('reverseReferences', () => {
  it('finds the sources that reference a given id', () => {
    const refs = collectReferences(
      contributions.referenceProviders,
      contributions.nodeRefExtractors,
      dataByFile,
    );
    expect(reverseReferences(refs, 'item', 'apple')).toEqual(['page:p1']);
    expect(reverseReferences(refs, 'item', 'ghost')).toEqual(['page:p2']);
    expect(reverseReferences(refs, 'item', 'missing')).toEqual([]);
  });
});

describe('namespaceOf', () => {
  it('resolves the namespace an id belongs to within a file', () => {
    expect(
      namespaceOf('items', 'apple', dataByFile, contributions.idSources),
    ).toBe('item');
    expect(
      namespaceOf('scenes', 'cafe', dataByFile, contributions.idSources),
    ).toBe('scene');
    expect(
      namespaceOf('items', 'cafe', dataByFile, contributions.idSources),
    ).toBeNull();
  });
});

describe('rewriteReferences', () => {
  it('rewrites every reference to an id and leaves others untouched', () => {
    const data = structuredClone(dataByFile);
    const { changed, count } = rewriteReferences(
      data,
      contributions,
      'item',
      'apple',
      'pear',
    );
    expect(count).toBe(1);
    const pages = changed.pages as { effects: { itemId: string }[] }[];
    expect(pages[0].effects[0].itemId).toBe('pear');
    expect(pages[1].effects[0].itemId).toBe('ghost');
    // Originals are not mutated (rewrite works on deep clones).
    expect((dataByFile.pages[0].effects[0] as { itemId: string }).itemId).toBe(
      'apple',
    );
  });

  it('introduces no new broken references after renaming id + references', () => {
    const data = structuredClone(dataByFile);
    const { changed } = rewriteReferences(
      data,
      contributions,
      'item',
      'apple',
      'pear',
    );
    const next = {
      ...data,
      ...changed,
      items: [{ id: 'pear' }], // the id source itself renamed by its panel
    };
    // Only the pre-existing 'ghost' issue remains — nothing about apple/pear.
    const issues = validateReferences(next, contributions);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('ghost');
    expect(issues.some((i) => i.message.includes('apple'))).toBe(false);
  });
});
