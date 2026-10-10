import { Progress } from '@chemicalluck/sim-engine/components/ui/progress';
import {
  isNeedHidden,
  needTier,
} from '@chemicalluck/sim-engine/features/needs/lib/colour';
import { selectNeeds } from '@chemicalluck/sim-engine/features/needs/selectors';
import { cn } from '@chemicalluck/sim-engine/lib/css';
import { useEngineSelector } from '@chemicalluck/sim-engine/state/store';

export default function NeedsDisplay() {
  const needs = useEngineSelector(selectNeeds);
  return (
    <div className="flex flex-col gap-2">
      {Object.entries(needs).map(([need, value]) => {
        if (isNeedHidden(need, value)) return null;
        const tier = needTier(need, value);
        return (
          <div key={need} className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-xs capitalize text-muted-foreground">
              {need}
            </span>
            <Progress
              value={value}
              className={cn(
                'flex-1 h-1.5 [&>div]:transition-colors [&>div]:duration-500',
                tier === 'good'
                  ? '[&>div]:bg-emerald-500 dark:[&>div]:bg-emerald-400'
                  : tier === 'low'
                    ? '[&>div]:bg-amber-500 dark:[&>div]:bg-amber-400'
                    : '[&>div]:bg-destructive',
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
