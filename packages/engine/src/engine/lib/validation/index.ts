import type {
  ContentRef,
  IdSource,
  NodeRefExtractor,
  NodeRefRewriter,
  RefNode,
  RefRecord,
  ReferenceContributions,
  ReferenceProvider,
  ValidationIssue,
} from './types';

export * from './types';
export * from './walk';

/** Map of data-file base name → its parsed JSON contents. */
export type DataByFile = Record<string, unknown>;

/** Build namespace → set-of-ids registries from the available id sources. */
export function buildRegistries(
  idSources: IdSource[],
  dataByFile: DataByFile,
): Map<string, Set<string>> {
  const registries = new Map<string, Set<string>>();
  for (const src of idSources) {
    const data = dataByFile[src.file];
    if (data === undefined) continue;
    let set = registries.get(src.namespace);
    if (!set) {
      set = new Set<string>();
      registries.set(src.namespace, set);
    }
    for (const id of src.select(data)) set.add(id);
  }
  return registries;
}

/** Compose the node extractors into a single reference-extracting function. */
export function makeExtract(
  extractors: NodeRefExtractor[],
): (node: RefNode) => ContentRef[] {
  return (node) => extractors.flatMap((extract) => extract(node));
}

/** Compose the node rewriters into a single reference-rewriting function. */
export function makeRewrite(
  rewriters: NodeRefRewriter[],
): (node: RefNode, namespace: string, oldId: string, newId: string) => boolean {
  return (node, namespace, oldId, newId) => {
    let changed = false;
    for (const rewrite of rewriters) {
      if (rewrite(node, namespace, oldId, newId)) changed = true;
    }
    return changed;
  };
}

/**
 * Find the namespace a given id belongs to within a data file, by testing which
 * of the file's id sources claims it. Returns `null` when no source matches
 * (e.g. files with no id source, like named NPCs). Fully dynamic — derived from
 * the contributions, with no hardcoded file→namespace mapping.
 */
export function namespaceOf(
  file: string,
  id: string,
  dataByFile: DataByFile,
  idSources: IdSource[],
): string | null {
  const data = dataByFile[file];
  if (data === undefined) return null;
  for (const src of idSources) {
    if (src.file !== file) continue;
    if (src.select(data).includes(id)) return src.namespace;
  }
  return null;
}

/** Gather every located reference across all content providers. */
export function collectReferences(
  providers: ReferenceProvider[],
  extractors: NodeRefExtractor[],
  dataByFile: DataByFile,
): RefRecord[] {
  const extract = makeExtract(extractors);
  const records: RefRecord[] = [];
  for (const provider of providers) {
    const data = dataByFile[provider.file];
    if (data === undefined) continue;
    records.push(...provider.collect(data, extract));
  }
  return records;
}

/**
 * Find every reference whose target id is unknown. A namespace with no id
 * source present is skipped (can't be validated, rather than flag everything).
 */
export function validateReferences(
  dataByFile: DataByFile,
  contributions: ReferenceContributions,
): ValidationIssue[] {
  const registries = buildRegistries(contributions.idSources, dataByFile);
  const records = collectReferences(
    contributions.referenceProviders,
    contributions.nodeRefExtractors,
    dataByFile,
  );
  const issues: ValidationIssue[] = [];
  for (const rec of records) {
    const registry = registries.get(rec.namespace);
    if (registry && !registry.has(rec.id)) {
      issues.push({
        section: rec.section,
        source: rec.source,
        message: `references unknown ${rec.namespace} '${rec.id}'`,
      });
    }
  }
  return issues;
}

/** Source labels that reference the given id (deduplicated, order-preserving). */
export function reverseReferences(
  records: RefRecord[],
  namespace: string,
  id: string,
): string[] {
  const sources: string[] = [];
  for (const rec of records) {
    if (
      rec.namespace === namespace &&
      rec.id === id &&
      !sources.includes(rec.source)
    ) {
      sources.push(rec.source);
    }
  }
  return sources;
}

/**
 * Rewrite every reference to `oldId` (within `namespace`) to `newId` across all
 * content files, using the registered reference rewriters. Returns the files
 * whose contents changed (deep-cloned, originals untouched) and the total number
 * of references rewritten. Symmetric to {@link collectReferences}.
 */
export function rewriteReferences(
  dataByFile: DataByFile,
  contributions: ReferenceContributions,
  namespace: string,
  oldId: string,
  newId: string,
): { changed: DataByFile; count: number } {
  const rewriteNode = makeRewrite(contributions.nodeRefRewriters);
  const changed: DataByFile = {};
  let count = 0;
  for (const rewriter of contributions.referenceRewriters) {
    const data = dataByFile[rewriter.file];
    if (data === undefined) continue;
    const clone = structuredClone(data);
    const n = rewriter.rewrite(
      clone,
      (node) => rewriteNode(node, namespace, oldId, newId),
      namespace,
      oldId,
      newId,
    );
    if (n > 0) {
      changed[rewriter.file] = clone;
      count += n;
    }
  }
  return { changed, count };
}

/** The set of data files the contributions need loaded, derived dynamically. */
export function requiredFiles(contributions: ReferenceContributions): string[] {
  const files = new Set<string>();
  for (const src of contributions.idSources) files.add(src.file);
  for (const provider of contributions.referenceProviders)
    files.add(provider.file);
  for (const rewriter of contributions.referenceRewriters)
    files.add(rewriter.file);
  return [...files];
}
