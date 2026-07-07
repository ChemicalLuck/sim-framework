import { toast } from 'sonner';
import { depositItem, withdrawItem } from '@chemicalluck/engine/features/containers/slice';
import {
  type EffectContext,
  dispatchWithGroup,
} from '@chemicalluck/engine/features/core/types';
import { GlobalLogger } from '@chemicalluck/engine/lib/logger';
import { clampAdd } from '@chemicalluck/engine/lib/maths';

import {
  adjustBodyAttribute,
  equipItem,
  unequipItem,
  updateSkill,
} from './slice';
import type {
  BodyAttributeEffect,
  EquipEffect,
  InventoryEffect,
  SkillEffect,
} from './types';

const logger = GlobalLogger.child('player');

export function handleInventoryEffect(
  effect: InventoryEffect,
  { dispatch, group }: EffectContext,
) {
  if (effect.operation === 'add') {
    logger.debug('Adding inventory item:', effect.item);
    toast.success('Item Added to Inventory');
    dispatchWithGroup(
      dispatch,
      depositItem({ containerId: 'player', item: effect.item }),
      group,
    );
  } else {
    logger.debug('Removing inventory item by ID:', effect.id);
    toast.success('Item Removed from Inventory');
    dispatchWithGroup(
      dispatch,
      withdrawItem({ containerId: 'player', itemId: effect.id }),
      group,
    );
  }
}

export function handleEquipEffect(
  effect: EquipEffect,
  { dispatch, group }: EffectContext,
) {
  if (effect.operation === 'don') {
    logger.debug('Equipping: ', effect.wearable);
    toast(`Equipped: ${effect.wearable.name}`);
    dispatchWithGroup(dispatch, equipItem(effect.wearable), group);
  } else {
    logger.debug('Unequipping: ', effect.wearable);
    toast(`Unequipped: ${effect.wearable.name}`);
    dispatchWithGroup(dispatch, unequipItem(effect.wearable.slot), group);
  }
}

export function handleSkillEffect(
  effect: SkillEffect,
  { dispatch, group, prevState }: EffectContext,
) {
  const current = prevState.present.player.skills[effect.skill] ?? 0;
  const next = clampAdd(current, effect.delta, 0, 10);
  dispatchWithGroup(
    dispatch,
    updateSkill({ skill: effect.skill, value: next }),
    group,
  );
}

export function handleBodyAttributeEffect(
  effect: BodyAttributeEffect,
  { dispatch, group }: EffectContext,
) {
  dispatchWithGroup(
    dispatch,
    adjustBodyAttribute({ attribute: effect.attribute, delta: effect.delta }),
    group,
  );
}

export default {
  inventory: handleInventoryEffect,
  equip: handleEquipEffect,
  skill: handleSkillEffect,
  bodyAttribute: handleBodyAttributeEffect,
};
