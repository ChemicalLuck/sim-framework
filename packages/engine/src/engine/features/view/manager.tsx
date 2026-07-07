import { selectView } from '@sim/engine/features/view/selectors';
import { GlobalLogger } from '@sim/engine/lib/logger';
import { useEngineSelector } from '@sim/engine/state/store';

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
