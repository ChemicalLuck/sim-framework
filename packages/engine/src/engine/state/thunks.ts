import type { EffectContext } from '@sim/engine/features/core/types';
import { GlobalLogger } from '@sim/engine/lib/logger';
import type { Effect } from '@sim/engine/types';

import type { EngineThunk } from './store';

const logger = GlobalLogger.child('effects');

export type EffectHandler = (effect: Effect, ctx: EffectContext) => void;
export type PostEffectHandler = (ctx: EffectContext) => void;

export function hashEffects(): string {
  return `effects:${crypto.randomUUID()}`;
}

let _handlers: Partial<Record<string, EffectHandler>> = {};
let _postHandlers: PostEffectHandler[] = [];

export function initProcessEffects(
  handlers: Record<string, EffectHandler> = {},
  postHandlers: PostEffectHandler[] = [],
) {
  _handlers = handlers;
  _postHandlers = postHandlers;
}

export const processEffects =
  (effects: Effect[], group?: string): EngineThunk =>
  (dispatch, getState) => {
    const prevState = getState();
    const resolvedGroup = group ?? hashEffects();
    logger.groupCollapsed(resolvedGroup);

    const ctx: EffectContext = {
      dispatch,
      group: resolvedGroup,
      prevState,
      effects,
    };

    for (const effect of effects) {
      logger.debug('Processing:', effect);
      const handler = _handlers[effect.kind];
      if (handler) {
        handler(effect, ctx);
      } else {
        logger.warn(`No handler for effect kind: ${effect.kind}`);
      }
    }

    ctx.newState = getState();

    for (const postHandler of _postHandlers) {
      postHandler(ctx);
    }

    logger.groupEnd();
  };
