import type { BaseEffect } from '@chemicalluck/engine/types/effect.types';

import type { ViewPropsMap } from './slice';

export type ViewEffect = {
  [V in keyof ViewPropsMap]: BaseEffect<'view'> & {
    readonly activeViewId: V;
    readonly props: ViewPropsMap[V];
  };
}[keyof ViewPropsMap];

export interface DescEffect extends BaseEffect<'desc'> {
  readonly text: string;
}

declare module '@chemicalluck/engine/types/effect.types' {
  interface EffectMap {
    view: ViewEffect;
    desc: DescEffect;
  }
}
