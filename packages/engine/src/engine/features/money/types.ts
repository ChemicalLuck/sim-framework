import type { BaseEffect } from '@chemicalluck/sim-engine/types/effect.types';

export interface MoneyEffect extends BaseEffect<'money'> {
  readonly amount: number;
}

declare module '@chemicalluck/sim-engine/types/effect.types' {
  interface EffectMap {
    money: MoneyEffect;
  }
}
