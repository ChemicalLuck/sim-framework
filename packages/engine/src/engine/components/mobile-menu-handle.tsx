import { ChevronUp } from 'lucide-react';

import { useVerticalSwipe } from '@chemicalluck/sim-engine/hooks/use-swipe';

import { useOptionalSidebar } from './ui/sidebar';

/** Phone-only tab pinned to the bottom edge: tap or swipe up to open the
 *  sidebar as a bottom sheet. */
export function MobileMenuHandle() {
  const sidebar = useOptionalSidebar();
  const swipe = useVerticalSwipe({
    onUp: () => sidebar?.setOpenMobile(true),
  });
  if (!sidebar) return null;

  return (
    <button
      type="button"
      aria-label="Open menu"
      onClick={() => {
        sidebar.setOpenMobile(true);
      }}
      {...swipe}
      className="fixed inset-x-0 bottom-0 z-20 flex touch-none flex-col items-center gap-1 rounded-t-2xl border-t bg-sidebar/95 pt-2 pb-[calc(0.625rem+env(safe-area-inset-bottom))] text-sidebar-foreground shadow-[0_-4px_16px_rgb(0_0_0/0.08)] backdrop-blur-md md:hidden"
    >
      <span className="h-1 w-10 rounded-full bg-muted-foreground/40" />
      <span className="flex items-center gap-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        <ChevronUp className="size-3.5" aria-hidden="true" />
        Menu
      </span>
    </button>
  );
}
