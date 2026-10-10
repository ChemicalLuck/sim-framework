declare module 'virtual:game-extensions' {
  import type { ComponentType } from 'react';
  import type { Reducer } from '@reduxjs/toolkit';
  import type { EffectHydrator } from '@chemicalluck/sim-engine/data/effect-hydrators';
  import type {
    TemplateVarDeclaration,
    TemplateVarProvider,
  } from '@chemicalluck/sim-engine/features/linguistics/lib/extension-vars';
  import type {
    EffectHandler,
    PostEffectHandler,
  } from '@chemicalluck/sim-engine/state/thunks';
  import type {
    EngineStore,
    RootState,
  } from '@chemicalluck/sim-engine/state/store';
  import type { ActionGroup } from '@chemicalluck/sim-engine/types';

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
  export const templateVarProviders: Record<string, TemplateVarProvider>;
  /** Each extension's `template-vars.ts` module, for its declared `keys`. */
  export const templateVarDeclarations: Record<string, TemplateVarDeclaration>;
}

declare module 'virtual:game-setup' {
  import type { Content } from '@chemicalluck/sim-engine/data';
  export const content: Content;
}

declare module 'virtual:references' {
  import type {
    IdSource,
    NodeRefExtractor,
    NodeRefRewriter,
    ReferenceProvider,
    ReferenceRewriter,
  } from '@chemicalluck/sim-engine/lib/validation';

  export const idSources: IdSource[];
  export const referenceProviders: ReferenceProvider[];
  export const nodeRefExtractors: NodeRefExtractor[];
  export const nodeRefRewriters: NodeRefRewriter[];
  export const referenceRewriters: ReferenceRewriter[];
  /** Data files (no `.json`) the feature manifests declare required. */
  export const requiredDataFiles: string[];
}

declare module 'virtual:conditions' {
  import type { Condition, Expr } from '@chemicalluck/sim-engine/types';
  import type { RootState } from '@chemicalluck/sim-engine/state/store';
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
  /** Parse `<identifier> <op> <literal>` into a feature-owned condition kind. */
  export const comparisonParsers: ((
    identifier: string,
    op: string,
    value: string | number,
  ) => Condition | null)[];
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
