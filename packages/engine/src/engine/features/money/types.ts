import type { BaseEffect } from '@sim/engine/types/effect.types';

export interface MoneyEffect extends BaseEffect<'money'> {
  readonly amount: number;
}

declare module '@sim/engine/types/effect.types' {
  interface EffectMap {
    money: MoneyEffect;
  }
}
