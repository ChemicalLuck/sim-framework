import { ActionButton } from '@chemicalluck/engine/components/action-button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@chemicalluck/engine/components/ui/card';
import { formatMoney } from '@chemicalluck/engine/features/money/lib/currency';
import type { InventoryItem } from '@chemicalluck/engine/types/item.types';

interface ShopCardProps {
  product: InventoryItem;
}

export function ShopCard({ product }: ShopCardProps) {
  return (
    <Card className="gap-2 py-4 justify-between">
      <CardHeader>
        <CardTitle className="text-base font-bold">{product.name}</CardTitle>
      </CardHeader>

      <CardContent className="text-sm flex flex-col gap-1">
        <span>{product.description}</span>
        <span className="text-muted-foreground">
          Price: {formatMoney(product.value)}
        </span>
      </CardContent>

      <CardFooter className="px-3 pb-3 justify-center">
        <ActionButton
          effects={[
            { kind: 'purchase', item: product, cost: product.value ?? 0 },
          ]}
        >
          Buy
        </ActionButton>
      </CardFooter>
    </Card>
  );
}

export default ShopCard;
