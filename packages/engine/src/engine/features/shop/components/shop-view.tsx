import { ActionButton } from '@chemicalluck/engine/components/action-button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@chemicalluck/engine/components/ui/tabs';
import WithSidebar from '@chemicalluck/engine/components/with-sidebar';
import { renderText } from '@chemicalluck/engine/features/linguistics/lib/template';
import { useTemplateContext } from '@chemicalluck/engine/features/linguistics/use-template-context';
import * as effects from '@chemicalluck/engine/features/view/helpers';

import type { Shop } from '../types';
import ShopCard from './shop-item-card';
import ShopTemplateCard from './shop-template-card';

interface ShopViewProps {
  shop: Shop;
}

function ShopView({ shop }: ShopViewProps) {
  const ctx = useTemplateContext();
  return (
    <WithSidebar>
      <p className="mb-4">{renderText(shop.text, ctx)}</p>
      <Tabs defaultValue={shop.tabs[0]?.title} className="mb-4">
        <TabsList className="mb-4">
          {shop.tabs.map((tab) => (
            <TabsTrigger key={tab.title} value={tab.title}>
              {tab.title}
            </TabsTrigger>
          ))}
        </TabsList>
        {shop.tabs.map((tab) => (
          <TabsContent key={tab.title} value={tab.title}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {tab.items.map((entry) => {
                switch (entry.kind) {
                  case 'item':
                  case 'wearable':
                    return (
                      <ShopCard key={entry.data.id} product={entry.data} />
                    );
                  case 'template':
                    return (
                      <ShopTemplateCard
                        key={entry.data.name}
                        template={entry.data}
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
