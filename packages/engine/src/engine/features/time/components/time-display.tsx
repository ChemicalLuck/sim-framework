import { selectTimestamp } from '@chemicalluck/sim-engine/features/time/selectors';
import { useEngineSelector } from '@chemicalluck/sim-engine/state/store';

export default function TimeDisplay() {
  const time = useEngineSelector(selectTimestamp);
  const date = new Date(time);
  return (
    <div className="flex flex-col items-center gap-0.5 py-1">
      <span className="text-sm font-semibold tabular-nums">
        {date.toLocaleString('en-GB', { timeStyle: 'short' })}
      </span>
      <span className="text-xs text-muted-foreground">
        {date.toLocaleString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })}
      </span>
    </div>
  );
}
