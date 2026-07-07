import { ActionButton } from '@chemicalluck/sim-engine/components/action-button';
import WithSidebar from '@chemicalluck/sim-engine/components/with-sidebar';
import * as defaultEffects from '@chemicalluck/sim-engine/features/view/helpers';

import Outfits from './outfits';
import Wardrobe from './wardrobe';

export default function OutfitView() {
  return (
    <WithSidebar>
      <Wardrobe />
      <Outfits />
      <ActionButton effects={[...defaultEffects.viewDefault()]}>
        Leave
      </ActionButton>
    </WithSidebar>
  );
}
