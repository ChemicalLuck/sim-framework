import { Wallet } from 'lucide-react';

import { formatMoney } from '@chemicalluck/sim-engine/features/money/lib/currency';
import { selectMoney } from '@chemicalluck/sim-engine/features/money/selectors';
import {
  isNeedHidden,
  needTier,
} from '@chemicalluck/sim-engine/features/needs/lib/colour';
import { selectNeeds } from '@chemicalluck/sim-engine/features/needs/selectors';
import { selectTimestamp } from '@chemicalluck/sim-engine/features/time/selectors';
import { getWeatherIcon } from '@chemicalluck/sim-engine/features/weather/lib/icons';
import { selectWeather } from '@chemicalluck/sim-engine/features/weather/selectors';
import { cn } from '@chemicalluck/sim-engine/lib/css';
import { useEngineSelector } from '@chemicalluck/sim-engine/state/store';

/** Phone-only header: on narrow screens the sidebar is a bottom sheet, so this
 *  bar keeps the clock, weather, wallet and needs in view. */
export function MobileTopBar() {
  const timestamp = useEngineSelector(selectTimestamp);
  const money = useEngineSelector(selectMoney);
  const weather = useEngineSelector(selectWeather);
  const needs = useEngineSelector(selectNeeds);
  const date = new Date(timestamp);
  const WeatherIcon = getWeatherIcon(weather.condition);
  const shownNeeds = Object.entries(needs).filter(
    ([need, value]) => !isNeedHidden(need, value),
  );

  return (
    <header className="sticky top-0 z-20 border-b bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-md supports-[backdrop-filter]:bg-background/70 md:hidden">
      <div className="grid h-12 grid-cols-[1fr_auto_1fr] items-center gap-3 px-4">
        <div
          className="flex items-center gap-1.5 text-sm tabular-nums"
          title={weather.condition.label}
        >
          <WeatherIcon
            className={cn('size-4', weather.condition.iconColor)}
            aria-hidden="true"
          />
          {weather.temperature}°C
        </div>
        <div className="flex items-baseline justify-center gap-2 leading-none">
          <span className="text-base font-semibold tabular-nums">
            {date.toLocaleString('en-GB', {
              timeStyle: 'short',
              timeZone: 'UTC',
            })}
          </span>
          <span className="text-xs whitespace-nowrap text-muted-foreground">
            {date.toLocaleString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              timeZone: 'UTC',
            })}
          </span>
        </div>
        <div className="flex items-center justify-end gap-1.5 text-sm font-medium tabular-nums">
          <Wallet className="size-4 text-muted-foreground" aria-hidden="true" />
          {formatMoney(money)}
        </div>
      </div>
      {shownNeeds.length > 0 && (
        <div className="flex gap-3 px-4 pb-2.5">
          {shownNeeds.map(([need, value]) => {
            const tier = needTier(need, value);
            return (
              <div
                key={need}
                role="meter"
                aria-label={need}
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={100}
                className="flex min-w-0 flex-1 flex-col gap-1"
              >
                <span className="truncate text-[10px] leading-none tracking-wide text-muted-foreground uppercase">
                  {need}
                </span>
                <span className="h-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className={cn(
                      'block h-full rounded-full transition-[width,background-color] duration-500',
                      tier === 'good'
                        ? 'bg-emerald-500 dark:bg-emerald-400'
                        : tier === 'low'
                          ? 'bg-amber-500 dark:bg-amber-400'
                          : 'bg-destructive',
                    )}
                    style={{
                      width: `${String(Math.max(0, Math.min(100, value)))}%`,
                    }}
                  />
                </span>
              </div>
            );
          })}
        </div>
      )}
    </header>
  );
}
