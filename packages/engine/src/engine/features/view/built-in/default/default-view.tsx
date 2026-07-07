import { ActionGroup } from '@chemicalluck/engine/components/action-group';
import { Minimap } from '@chemicalluck/engine/components/minimap';
import WithSidebar from '@chemicalluck/engine/components/with-sidebar';
import { renderText } from '@chemicalluck/engine/features/linguistics/lib/template';
import { useTemplateContext } from '@chemicalluck/engine/features/linguistics/use-template-context';
import { selectNpcsNearby } from '@chemicalluck/engine/features/npcs/selectors';
import { selectCurrentLocation } from '@chemicalluck/engine/features/player/selectors';
import { selectDescription } from '@chemicalluck/engine/features/view/selectors';
import { useEngineSelector } from '@chemicalluck/engine/state/store';

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
