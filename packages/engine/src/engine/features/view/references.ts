import type {
  NodeRefExtractor,
  NodeRefRewriter,
} from '@sim/engine/lib/validation';

const viewRef: NodeRefExtractor = (node) => {
  if (!('kind' in node) || node.kind !== 'view') return [];
  if ('sceneId' in node) return [{ namespace: 'scene', id: node.sceneId }];
  if ('scriptId' in node) return [{ namespace: 'script', id: node.scriptId }];
  return [];
};

export const nodeRefExtractors: NodeRefExtractor[] = [viewRef];

const viewRewrite: NodeRefRewriter = (node, ns, oldId, newId) => {
  if (!('kind' in node) || node.kind !== 'view') return false;
  if (ns === 'scene' && 'sceneId' in node && node.sceneId === oldId) {
    (node as { sceneId: string }).sceneId = newId;
    return true;
  }
  if (ns === 'script' && 'scriptId' in node && node.scriptId === oldId) {
    (node as { scriptId: string }).scriptId = newId;
    return true;
  }
  return false;
};

export const nodeRefRewriters: NodeRefRewriter[] = [viewRewrite];
