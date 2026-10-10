import { getNeedOptions } from '../slice';

export type NeedTier = 'good' | 'low' | 'critical';

/** How a need is doing: high is good, unless the need is inverse. */
export function needTier(need: string, value: number): NeedTier {
  const goodness =
    getNeedOptions()[need]?.direction === 'inverse' ? 100 - value : value;
  if (goodness > 60) return 'good';
  if (goodness > 30) return 'low';
  return 'critical';
}

/** Whether a need is hidden right now (`hideAtZero` and empty). */
export function isNeedHidden(need: string, value: number): boolean {
  return !!getNeedOptions()[need]?.hideAtZero && value <= 0;
}
