import { ActionButton } from '@sim/engine/components/action-button';
import WithSidebar from '@sim/engine/components/with-sidebar';
import * as defaultEffects from '@sim/engine/features/view/helpers';

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
