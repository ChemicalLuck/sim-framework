import { shallowEqual } from 'react-redux';

import { ActionButton } from '@chemicalluck/sim-engine/components/action-button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@chemicalluck/sim-engine/components/ui/tabs';
import WithSidebar from '@chemicalluck/sim-engine/components/with-sidebar';
import { renderText } from '@chemicalluck/sim-engine/features/linguistics/lib/template';
import { useTemplateContext } from '@chemicalluck/sim-engine/features/linguistics/use-template-context';
import * as effects from '@chemicalluck/sim-engine/features/view/helpers';
import { isConditionMet } from '@chemicalluck/sim-engine/lib/conditions';
import { useEngineSelector } from '@chemicalluck/sim-engine/state/store';

import { resolveShopWith, shopGates } from '../lib/shop';
import type { Shop } from '../types';
import ShopCard from './shop-item-card';
import ShopTemplateCard from './shop-template-card';

interface ShopViewProps {
  shop: Shop;
}

function ShopView({ shop }: ShopViewProps) {
  const ctx = useTemplateContext();
  const gates = shopGates(shop);
  const met = useEngineSelector(
    (state) => gates.map((g) => isConditionMet(state, g.condition)),
    shallowEqual,
  );
  const tabs = resolveShopWith(shop, (gate) => met[gates.indexOf(gate)]);
  const firstOpen = tabs.find((t) => t.lockedText == null);
  return (
    <WithSidebar>
      <p className="mb-4">{renderText(shop.text, ctx)}</p>
      <Tabs defaultValue={firstOpen?.title} className="mb-4">
        <TabsList className="mb-4">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.title}
              value={tab.title}
              disabled={tab.lockedText != null}
            >
              {tab.title}
              {tab.lockedText != null && (
                <span className="text-xs italic">({tab.lockedText})</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.title} value={tab.title}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {tab.entries.map(({ entry, price, lockedText }) => {
                switch (entry.kind) {
                  case 'item':
                  case 'wearable':
                    return (
                      <ShopCard
                        key={entry.data.id}
                        product={entry.data}
                        price={price}
                        lockedText={lockedText}
                      />
                    );
                  case 'template':
                    return (
                      <ShopTemplateCard
                        key={entry.data.name}
                        template={entry.data}
                        price={price}
                        lockedText={lockedText}
                      />
                    );
                }
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      <ActionButton effects={effects.viewDefault()}>Stop shopping</ActionButton>
    </WithSidebar>
  );
}

export default ShopView;
