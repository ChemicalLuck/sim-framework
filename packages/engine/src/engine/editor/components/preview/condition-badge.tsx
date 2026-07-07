import { Badge } from '@chemicalluck/engine/components/ui/badge';
import { conditionToString } from '@chemicalluck/engine/editor/lib/condition-utils';
import { isConditionMet } from '@chemicalluck/engine/lib/conditions';
import type { Condition } from '@chemicalluck/engine/types/condition.types';

import { usePreviewState } from './mock-state';

/**
 * Evaluates a condition against the shared mock state and shows a met/unmet
 * badge. Unknown condition kinds or missing state slices fall back to a neutral
 * "?" rather than throwing. Renders nothing when there is no condition.
 */
export function ConditionBadge({ condition }: { condition?: Condition }) {
  const { mockState } = usePreviewState();
  if (!condition) return null;

  let met: boolean | null;
  try {
    met = isConditionMet(mockState, condition);
  } catch {
    met = null;
  }

  let label: string;
  try {
    label = conditionToString(condition);
  } catch {
    label = 'condition';
  }

  const className =
    met === null
      ? 'bg-zinc-700 text-zinc-300'
      : met
        ? 'bg-green-900/70 text-green-300'
        : 'bg-red-900/70 text-red-300';

  return (
    <Badge className={className} title={label}>
      {met === null ? '?' : met ? '✓' : '✕'} {label}
    </Badge>
  );
}
