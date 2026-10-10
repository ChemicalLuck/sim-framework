import { useOptionalSidebar } from '../ui/sidebar';

/** Sidebar content that phones skip: the mobile top bar already shows it, so
 *  the bottom sheet keeps to actions. */
export function DesktopOnly({ children }: React.PropsWithChildren) {
  const sidebar = useOptionalSidebar();
  if (sidebar?.isMobile) return null;
  return children;
}
