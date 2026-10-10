import { ActionButton } from '@chemicalluck/sim-engine/components/action-button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@chemicalluck/sim-engine/components/ui/card';
import { formatMoney } from '@chemicalluck/sim-engine/features/money/lib/currency';
import type { InventoryItem } from '@chemicalluck/sim-engine/types/item.types';

interface ShopCardProps {
  product: InventoryItem;
  /** From shopEntryPrice: both shown and charged. */
  price: number;
  /** Shown instead of the buy button when the entry is locked. */
  lockedText?: string;
}

export function ShopCard({ product, price, lockedText }: ShopCardProps) {
  return (
    <Card className="gap-2 py-4 justify-between">
      <CardHeader>
        <CardTitle className="text-base font-bold">{product.name}</CardTitle>
      </CardHeader>

      <CardContent className="text-sm flex flex-col gap-1">
        <span>{product.description}</span>
        <span className="text-muted-foreground">
          Price: {formatMoney(price)}
        </span>
      </CardContent>

      <CardFooter className="px-3 pb-3 justify-center">
        <ActionButton
          effects={[{ kind: 'purchase', item: product, cost: price }]}
          disabled={lockedText != null}
        >
          Buy
          {lockedText != null && (
            <span className="text-xs italic">({lockedText})</span>
          )}
        </ActionButton>
      </CardFooter>
    </Card>
  );
}

export default ShopCard;
