import { Progress } from '@sim/engine/components/ui/progress';
import { selectNeeds } from '@sim/engine/features/needs/selectors';
import { cn } from '@sim/engine/lib/css';
import { useEngineSelector } from '@sim/engine/state/store';

export default function NeedsDisplay() {
  const needs = useEngineSelector(selectNeeds);
  return (
    <div className="flex flex-col gap-2">
      {Object.entries(needs).map(([need, value]) => (
        <div key={need} className="flex items-center gap-2">
          <span className="w-14 shrink-0 text-xs capitalize text-muted-foreground">
            {need}
          </span>
          <Progress
            value={value}
            className={cn(
              'flex-1 h-1.5 [&>div]:transition-colors [&>div]:duration-500',
              value > 60
                ? '[&>div]:bg-emerald-500 dark:[&>div]:bg-emerald-400'
                : value > 30
                  ? '[&>div]:bg-amber-500 dark:[&>div]:bg-amber-400'
                  : '[&>div]:bg-destructive',
            )}
          />
        </div>
      ))}
    </div>
  );
}
