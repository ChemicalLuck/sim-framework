declare module 'virtual:game-extensions' {
  import type { ComponentType } from 'react';
  import type { Reducer } from '@reduxjs/toolkit';
  import type { EffectHydrator } from '@chemicalluck/engine/data/effect-hydrators';
  import type { EffectHandler, PostEffectHandler } from '@chemicalluck/engine/state/thunks';
  import type { EngineStore, RootState } from '@chemicalluck/engine/state/store';
  import type { ActionGroup } from '@chemicalluck/engine/types';

  export const slices: Record<string, Reducer>;
  export const effectHandlers: Record<string, EffectHandler>;
  export const postEffectHandlers: PostEffectHandler[];
  export const actionGroupProviders: ((
    locationId: string,
    state: RootState,
  ) => ActionGroup[])[];
  export const views: Record<string, ComponentType<never>>;
  export const effectHydrators: EffectHydrator[];
  export const storeInitializers: ((store: EngineStore) => void)[];
}

declare module 'virtual:game-setup' {
  import type { Content } from '@chemicalluck/engine/data';
  export const content: Content;
}

declare module 'virtual:references' {
  import type {
    IdSource,
    NodeRefExtractor,
    NodeRefRewriter,
    ReferenceProvider,
    ReferenceRewriter,
  } from '@chemicalluck/engine/lib/validation';

  export const idSources: IdSource[];
  export const referenceProviders: ReferenceProvider[];
  export const nodeRefExtractors: NodeRefExtractor[];
  export const nodeRefRewriters: NodeRefRewriter[];
  export const referenceRewriters: ReferenceRewriter[];
}

declare module 'virtual:conditions' {
  import type { Condition, Expr } from '@chemicalluck/engine/types';
  import type { RootState } from '@chemicalluck/engine/state/store';
  export const conditionEvaluators: Record<
    string,
    ((cond: Condition, state: RootState) => boolean) | undefined
  >;
  export const exprEvaluators: Record<
    string,
    ((expr: Expr, state: RootState) => number | string) | undefined
  >;
  export const conditionParsers: ((identifier: string) => Condition | null)[];
  export const exprParsers: ((identifier: string) => Expr | null)[];
  export const exprKinds: Set<string>;
  export const conditionSerializers: Record<
    string,
    ((cond: Condition) => string) | undefined
  >;
  export const exprSerializers: Record<
    string,
    ((expr: Expr) => string) | undefined
  >;
}
