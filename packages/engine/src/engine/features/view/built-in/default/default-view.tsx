import { ActionGroup } from '@chemicalluck/sim-engine/components/action-group';
import { Minimap } from '@chemicalluck/sim-engine/components/minimap';
import WithSidebar from '@chemicalluck/sim-engine/components/with-sidebar';
import { renderText } from '@chemicalluck/sim-engine/features/linguistics/lib/template';
import { useTemplateContext } from '@chemicalluck/sim-engine/features/linguistics/use-template-context';
import { selectNpcsNearby } from '@chemicalluck/sim-engine/features/npcs/selectors';
import { selectCurrentLocation } from '@chemicalluck/sim-engine/features/player/selectors';
import { selectDescription } from '@chemicalluck/sim-engine/features/view/selectors';
import { useEngineSelector } from '@chemicalluck/sim-engine/state/store';

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
