import { Wallet } from 'lucide-react';
import { formatMoney } from '@sim/engine/features/money/lib/currency';
import { selectMoney } from '@sim/engine/features/money/selectors';
import { useEngineSelector } from '@sim/engine/state/store';

export default function MoneyDisplay() {
  const money = useEngineSelector(selectMoney);
  return (
    <div className="flex items-center justify-center gap-1.5 text-sm font-medium">
      <Wallet className="size-3.5 text-muted-foreground" />
      {formatMoney(money)}
    </div>
  );
}
