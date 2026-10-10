import { Menu, Wallet } from 'lucide-react';

import { formatMoney } from '@chemicalluck/sim-engine/features/money/lib/currency';
import { selectMoney } from '@chemicalluck/sim-engine/features/money/selectors';
import { selectTimestamp } from '@chemicalluck/sim-engine/features/time/selectors';
import { useEngineSelector } from '@chemicalluck/sim-engine/state/store';

import { useOptionalSidebar } from './ui/sidebar';

/** Phone-only header: on narrow screens the sidebar is a drawer, so this bar
 *  keeps the clock and wallet in view and holds the button that opens it. */
export function MobileTopBar() {
  const sidebar = useOptionalSidebar();
  const timestamp = useEngineSelector(selectTimestamp);
  const money = useEngineSelector(selectMoney);
  const date = new Date(timestamp);

  return (
    <header className="sticky top-0 z-20 grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b bg-background/85 px-2 pt-[env(safe-area-inset-top)] backdrop-blur-md supports-[backdrop-filter]:bg-background/70 md:hidden">
      {sidebar ? (
        <button
          type="button"
          onClick={sidebar.toggleSidebar}
          aria-label="Open menu"
          className="flex size-11 items-center justify-center rounded-md text-foreground active:bg-accent"
        >
          <Menu className="size-5" />
        </button>
      ) : (
        <span className="size-11" />
      )}
      <div className="flex min-w-0 items-baseline justify-center gap-2 leading-none">
        <span className="text-base font-semibold tabular-nums">
          {date.toLocaleString('en-GB', {
            timeStyle: 'short',
            timeZone: 'UTC',
          })}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {date.toLocaleString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            timeZone: 'UTC',
          })}
        </span>
      </div>
      <div className="flex items-center gap-1.5 pr-2 text-sm font-medium tabular-nums">
        <Wallet className="size-4 text-muted-foreground" aria-hidden="true" />
        {formatMoney(money)}
      </div>
    </header>
  );
}
