import {
  type IdSource,
  type NodeRefExtractor,
  type NodeRefRewriter,
} from '@chemicalluck/engine/lib/validation';

export const idSources: IdSource[] = [
  {
    namespace: 'milestone',
    file: 'milestones',
    select: (data) => (data as { id: string }[]).map((m) => m.id),
  },
];

// The `milestone` kind is both an effect and a condition; both carry a
// `milestoneId`, so one extractor covers both node types.
const milestoneRef: NodeRefExtractor = (node) =>
  'kind' in node &&
  node.kind === 'milestone' &&
  'milestoneId' in node &&
  typeof node.milestoneId === 'string'
    ? [{ namespace: 'milestone', id: node.milestoneId }]
    : [];

export const nodeRefExtractors: NodeRefExtractor[] = [milestoneRef];

const milestoneRewrite: NodeRefRewriter = (node, ns, oldId, newId) => {
  if (
    ns === 'milestone' &&
    'kind' in node &&
    node.kind === 'milestone' &&
    'milestoneId' in node &&
    typeof node.milestoneId === 'string' &&
    node.milestoneId === oldId
  ) {
    (node as { milestoneId: string }).milestoneId = newId;
    return true;
  }
  return false;
};

export const nodeRefRewriters: NodeRefRewriter[] = [milestoneRewrite];
