import { useRef } from 'react';

const THRESHOLD = 24;

/** Touch handlers that call `onUp` / `onDown` on a vertical swipe. */
export function useVerticalSwipe({
  onUp,
  onDown,
}: {
  onUp?: () => void;
  onDown?: () => void;
}) {
  const startY = useRef<number | null>(null);
  return {
    onTouchStart: (e: React.TouchEvent) => {
      startY.current = e.touches[0].clientY;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const start = startY.current;
      const end = e.changedTouches[0].clientY;
      startY.current = null;
      if (start === null) return;
      if (start - end > THRESHOLD) onUp?.();
      else if (end - start > THRESHOLD) onDown?.();
    },
  };
}
