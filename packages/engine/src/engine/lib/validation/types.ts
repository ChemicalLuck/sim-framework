import type { JsonEffectMap } from '@sim/engine/data/authoring.types';
import type { Condition } from '@sim/engine/types/condition.types';
import type { Effect } from '@sim/engine/types/effect.types';

/**
 * A reference- or condition-bearing node found inside authored content. Each
 * feature's reference extractors narrow this to the concrete authoring type of
 * the effect/condition kind they own.
 */
export type RefNode = JsonEffectMap[keyof JsonEffectMap] | Effect | Condition;

/** A reference from authored content to an id within a namespace. */
export interface ContentRef {
  /** Logical namespace of the target id (e.g. 'item', 'scene', 'location'). */
  namespace: string;
  /** The referenced id. */
  id: string;
}

/** A located reference — a {@link ContentRef} tagged with where it came from. */
export interface RefRecord extends ContentRef {
  /** Source label, `prefix:id` (e.g. `scene:cafe`, `loc:home`). */
  source: string;
  /** Editor panel path the source belongs to (e.g. 'scenes', 'world'). */
  section: string;
}

/**
 * Declares that a feature is the source of truth for a namespace of ids, drawn
 * from a data file. `select` pulls the ids out of that file's parsed contents.
 */
export interface IdSource {
  namespace: string;
  /** Data file base name (no extension), e.g. 'items'. */
  file: string;
  select: (data: unknown) => string[];
}

/** Maps a single effect/condition node to the references it makes. */
export type NodeRefExtractor = (node: RefNode) => ContentRef[];

/**
 * Rewrites a single effect/condition node in place when it references `oldId`
 * within `namespace`, replacing it with `newId`. The symmetric counterpart of a
 * {@link NodeRefExtractor}. Returns `true` if the node was changed.
 */
export type NodeRefRewriter = (
  node: RefNode,
  namespace: string,
  oldId: string,
  newId: string,
) => boolean;

/**
 * Walks one content file and emits the references it contains. `extract` runs
 * every registered {@link NodeRefExtractor} over an effect/condition node — use
 * it for effect-bearing content; emit {@link RefRecord}s directly for content
 * that references ids structurally (e.g. shop entries, edges).
 */
export interface ReferenceProvider {
  /** Data file base name (no extension), e.g. 'scenes'. */
  file: string;
  /** Editor panel path the references belong to. */
  section: string;
  collect: (
    data: unknown,
    extract: (node: RefNode) => ContentRef[],
  ) => RefRecord[];
}

/**
 * Rewrites every reference to `oldId` (within `namespace`) inside one content
 * file, returning the number of references changed. The symmetric counterpart of
 * a {@link ReferenceProvider}: it mutates `data` in place. `rewriteNode` runs
 * every registered {@link NodeRefRewriter} over an effect/condition node — use it
 * for effect-bearing content; rewrite structural references (edges, parents, map
 * keys) directly.
 */
export interface ReferenceRewriter {
  /** Data file base name (no extension), e.g. 'scenes'. */
  file: string;
  rewrite: (
    data: unknown,
    rewriteNode: (node: RefNode) => boolean,
    namespace: string,
    oldId: string,
    newId: string,
  ) => number;
}

/** A broken reference: an id that no namespace source provides. */
export interface ValidationIssue {
  section: string;
  source: string;
  message: string;
}

/** The aggregate of every feature's reference contributions. */
export interface ReferenceContributions {
  idSources: IdSource[];
  referenceProviders: ReferenceProvider[];
  nodeRefExtractors: NodeRefExtractor[];
  nodeRefRewriters: NodeRefRewriter[];
  referenceRewriters: ReferenceRewriter[];
}
