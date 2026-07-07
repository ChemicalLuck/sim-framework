import { Wallet } from 'lucide-react';
import { formatMoney } from '@chemicalluck/engine/features/money/lib/currency';
import { selectMoney } from '@chemicalluck/engine/features/money/selectors';
import { useEngineSelector } from '@chemicalluck/engine/state/store';

export default function MoneyDisplay() {
  const money = useEngineSelector(selectMoney);
  return (
    <div className="flex items-center justify-center gap-1.5 text-sm font-medium">
      <Wallet className="size-3.5 text-muted-foreground" />
      {formatMoney(money)}
    </div>
  );
}
