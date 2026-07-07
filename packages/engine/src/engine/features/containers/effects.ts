import { toast } from 'sonner';
import {
  type EffectContext,
  dispatchWithGroup,
} from '@sim/engine/features/core/types';
import { GlobalLogger } from '@sim/engine/lib/logger';

import { clearContainer, depositItem, withdrawItem } from './slice';
import type { ContainerEffect } from './types';

const logger = GlobalLogger.child('containers');

export function handleContainerEffect(
  effect: ContainerEffect,
  { dispatch, group, prevState }: EffectContext,
) {
  const containers = prevState.present.containers;

  switch (effect.operation) {
    case 'deposit': {
      const item = containers.player?.find((i) => i.id === effect.itemId);
      if (!item) {
        logger.warn(
          `container deposit: item '${effect.itemId}' not in player inventory`,
        );
        return;
      }
      dispatchWithGroup(
        dispatch,
        withdrawItem({ containerId: 'player', itemId: effect.itemId }),
        group,
      );
      dispatchWithGroup(
        dispatch,
        depositItem({ containerId: effect.containerId, item }),
        group,
      );
      toast.success('Item stored');
      break;
    }

    case 'deposit_wearables': {
      const wearables = (containers.player ?? []).filter(
        (i) => i.kind === 'wearable',
      );
      if (wearables.length === 0) return;
      for (const item of wearables) {
        dispatchWithGroup(
          dispatch,
          withdrawItem({ containerId: 'player', itemId: item.id }),
          group,
        );
        dispatchWithGroup(
          dispatch,
          depositItem({ containerId: effect.containerId, item }),
          group,
        );
      }
      toast.success('Clothes loaded');
      break;
    }

    case 'deposit_all': {
      const items = containers.player ?? [];
      if (items.length === 0) return;
      for (const item of items) {
        dispatchWithGroup(
          dispatch,
          withdrawItem({ containerId: 'player', itemId: item.id }),
          group,
        );
        dispatchWithGroup(
          dispatch,
          depositItem({ containerId: effect.containerId, item }),
          group,
        );
      }
      toast.success('Items stored');
      break;
    }

    case 'insert': {
      dispatchWithGroup(
        dispatch,
        depositItem({ containerId: effect.containerId, item: effect.item }),
        group,
      );
      break;
    }

    case 'withdraw': {
      const source = containers[effect.containerId] ?? [];
      const item = source.find((i) => i.id === effect.itemId);
      if (!item) {
        logger.warn(
          `container withdraw: item '${effect.itemId}' not in '${effect.containerId}'`,
        );
        return;
      }
      dispatchWithGroup(
        dispatch,
        withdrawItem({
          containerId: effect.containerId,
          itemId: effect.itemId,
        }),
        group,
      );
      dispatchWithGroup(
        dispatch,
        depositItem({ containerId: 'player', item }),
        group,
      );
      toast.success('Item retrieved');
      break;
    }

    case 'withdraw_all': {
      const items = containers[effect.containerId] ?? [];
      if (items.length === 0) return;
      for (const item of items) {
        dispatchWithGroup(
          dispatch,
          withdrawItem({ containerId: effect.containerId, itemId: item.id }),
          group,
        );
        dispatchWithGroup(
          dispatch,
          depositItem({ containerId: 'player', item }),
          group,
        );
      }
      toast.success('Items retrieved');
      break;
    }

    case 'transfer_all': {
      const items = containers[effect.fromId] ?? [];
      if (items.length === 0) return;
      for (const item of items) {
        dispatchWithGroup(
          dispatch,
          withdrawItem({ containerId: effect.fromId, itemId: item.id }),
          group,
        );
        dispatchWithGroup(
          dispatch,
          depositItem({ containerId: effect.toId, item }),
          group,
        );
      }
      break;
    }

    case 'clear': {
      dispatchWithGroup(
        dispatch,
        clearContainer({ containerId: effect.containerId }),
        group,
      );
      break;
    }
  }
}

export default { container: handleContainerEffect };
