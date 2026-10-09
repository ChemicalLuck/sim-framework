import { Progress } from '@chemicalluck/sim-engine/components/ui/progress';
import { selectNeeds } from '@chemicalluck/sim-engine/features/needs/selectors';
import { getNeedOptions } from '@chemicalluck/sim-engine/features/needs/slice';
import { cn } from '@chemicalluck/sim-engine/lib/css';
import { useEngineSelector } from '@chemicalluck/sim-engine/state/store';

export default function NeedsDisplay() {
  const needs = useEngineSelector(selectNeeds);
  const options = getNeedOptions();
  return (
    <div className="flex flex-col gap-2">
      {Object.entries(needs).map(([need, value]) => {
        const opts = options[need];
        if (opts?.hideAtZero && value <= 0) return null;
        // How good the value is: high is good, unless the need is inverse.
        const goodness = opts?.direction === 'inverse' ? 100 - value : value;
        return (
          <div key={need} className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-xs capitalize text-muted-foreground">
              {need}
            </span>
            <Progress
              value={value}
              className={cn(
                'flex-1 h-1.5 [&>div]:transition-colors [&>div]:duration-500',
                goodness > 60
                  ? '[&>div]:bg-emerald-500 dark:[&>div]:bg-emerald-400'
                  : goodness > 30
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
