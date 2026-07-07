import { ActionGroup } from '@sim/engine/components/action-group';
import { Minimap } from '@sim/engine/components/minimap';
import WithSidebar from '@sim/engine/components/with-sidebar';
import { renderText } from '@sim/engine/features/linguistics/lib/template';
import { useTemplateContext } from '@sim/engine/features/linguistics/use-template-context';
import { selectNpcsNearby } from '@sim/engine/features/npcs/selectors';
import { selectCurrentLocation } from '@sim/engine/features/player/selectors';
import { selectDescription } from '@sim/engine/features/view/selectors';
import { useEngineSelector } from '@sim/engine/state/store';

import DefaultActions from './default-actions';

function DefaultView() {
  const currentLocation = useEngineSelector(selectCurrentLocation);
  const currentDescription = useEngineSelector(selectDescription);
  const nearby = useEngineSelector(selectNpcsNearby);
  const ctx = useTemplateContext(nearby);
  return (
    <WithSidebar>
      <Minimap />
      <h2 className="text-lg font-semibold m-0">{currentLocation.name}</h2>
      {currentLocation.description && (
        <p className="m-0">{renderText(currentLocation.description, ctx)}</p>
      )}
      {currentDescription && (
        <p className="m-0">{renderText(currentDescription, ctx)}</p>
      )}
      <ActionGroup>
        <DefaultActions />
      </ActionGroup>
    </WithSidebar>
  );
}

export default DefaultView;
