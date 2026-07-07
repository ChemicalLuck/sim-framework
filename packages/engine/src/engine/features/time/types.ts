import type { BaseEffect } from '@sim/engine/types/effect.types';

export interface TimeEffect extends BaseEffect<'time'> {
  hours?: number;
  minutes: number;
}

export interface SleepEffect extends BaseEffect<'sleep'> {
  readonly hours?: number;
  readonly wakeTime?: number;
}

declare module '@sim/engine/types/effect.types' {
  interface EffectMap {
    time: TimeEffect;
    sleep: SleepEffect;
  }
}
