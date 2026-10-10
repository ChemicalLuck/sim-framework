import { selectView } from '@chemicalluck/sim-engine/features/view/selectors';
import { GlobalLogger } from '@chemicalluck/sim-engine/lib/logger';
import { useEngineSelector } from '@chemicalluck/sim-engine/state/store';

import { useViews } from './context';

const logger = GlobalLogger.child('view');

// Hydrated scenes/scripts carry no id, so each object gets one on first sight.
const contentIds = new WeakMap<object, number>();
let nextContentId = 0;

/**
 * Key for the active view: changes when the view, or the scene/script it
 * shows, changes — so e.g. ScriptView → ScriptView remounts at step 0 instead
 * of keeping the previous script's state.
 */
function viewKey(activeViewId: string, props: Record<string, unknown>): string {
  const content = props.script ?? props.scene;
  if (!content || typeof content !== 'object') return activeViewId;
  let id = contentIds.get(content);
  if (id === undefined) {
    id = nextContentId++;
    contentIds.set(content, id);
  }
  return `${activeViewId}:${String(id)}`;
}

function ViewManager() {
  const { activeViewId, props } = useEngineSelector(selectView);
  const views = useViews();
  const rawComponent = views[activeViewId];

  if (!rawComponent) {
    logger.warn(`No view registered for id: ${activeViewId}`);
    return null;
  }

  const Component = rawComponent as unknown as React.ComponentType<
    Record<string, unknown>
  >;
  return <Component key={viewKey(activeViewId, props)} {...props} />;
}

export default ViewManager;
