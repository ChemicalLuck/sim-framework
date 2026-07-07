import { selectView } from '@chemicalluck/engine/features/view/selectors';
import { GlobalLogger } from '@chemicalluck/engine/lib/logger';
import { useEngineSelector } from '@chemicalluck/engine/state/store';

import { useViews } from './context';

const logger = GlobalLogger.child('view');

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
  return <Component {...props} />;
}

export default ViewManager;
