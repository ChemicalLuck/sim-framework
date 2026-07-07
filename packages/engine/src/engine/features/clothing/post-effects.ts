import {
  type EffectContext,
  dispatchWithGroup,
} from '@chemicalluck/engine/features/core/types';
import { increaseNeedByAmount } from '@chemicalluck/engine/features/needs/slice';
import { evaluateFit } from '@chemicalluck/engine/features/outfits/lib/fit';
import {
  getEstimatedMetrics,
  getSizeSystems,
} from '@chemicalluck/engine/features/outfits/lib/wearable-config';
import { getLocationById } from '@chemicalluck/engine/features/travel/lib/world';
import { computeDayWeather } from '@chemicalluck/engine/features/weather/lib/weather';
import type { WeatherConditionId } from '@chemicalluck/engine/features/weather/types';
import type { PostEffectHandler } from '@chemicalluck/engine/state/thunks';
import type { BodyAttributes } from '@chemicalluck/engine/types/character.types';

import { addWearMinutes, ensureItems, setWet } from './slice';
import { UMBRELLA_SLOT, WET_WEATHER_CONDITIONS } from './types';

const MAX_HYGIENE_DRAIN_PER_HOUR = 3;
const DIRTY_HYGIENE_DRAIN_PER_ITEM_PER_HOUR = 1;

const COMFORT_NEED = 'Comfort';
const COMFORT_DRAIN_PER_MISMATCH_PER_HOUR = 1.5;
const MAX_COMFORT_DRAIN_PER_HOUR = 6;
const COMFORT_RECOVERY_PER_HOUR = 5;

const clothingPostEffect: PostEffectHandler = ({
  dispatch,
  group,
  prevState,
  newState,
}: EffectContext) => {
  if (!newState) return;

  const totalMinutes =
    (newState.present.time.timestamp - prevState.present.time.timestamp) /
    60000;

  if (totalMinutes <= 0) return;

  const equipment = newState.present.player.equipment;
  const equippedWearables = Object.values(equipment).filter((w) => w != null);

  if (equippedWearables.length === 0) return;

  const equippedIds = equippedWearables
    .map((w) => w.instanceId)
    .filter((id): id is string => id != null);

  dispatchWithGroup(dispatch, ensureItems(equippedIds), group);
  dispatchWithGroup(
    dispatch,
    addWearMinutes({ ids: equippedIds, minutes: totalMinutes }),
    group,
  );

  const override = newState.present.weather.conditionOverride;
  const effectiveId: WeatherConditionId =
    override ??
    computeDayWeather(
      new Date(newState.present.time.timestamp),
      newState.present.rng.seed,
    ).conditionId;

  const isProtected = equipment[UMBRELLA_SLOT] != null;
  const isWetWeather = WET_WEATHER_CONDITIONS.has(effectiveId);
  const currentLocation = getLocationById(newState.present.player.locationId);
  const isOutdoors = currentLocation?.kind !== 'interior';
  const clothing = newState.present.clothing;

  // Clothing only gets wet outdoors in wet weather (without an umbrella).
  // Anywhere else — indoors, or once the weather clears — it dries off.
  if (isWetWeather && isOutdoors && !isProtected) {
    dispatchWithGroup(dispatch, setWet({ ids: equippedIds, wet: true }), group);
  } else {
    const wetIds = equippedIds.filter((id) => clothing[id]?.isWet);
    if (wetIds.length > 0) {
      dispatchWithGroup(dispatch, setWet({ ids: wetIds, wet: false }), group);
    }
  }

  const dirtyCount = equippedIds.filter(
    (id) => clothing[id]?.isDirty ?? false,
  ).length;

  if (dirtyCount > 0) {
    const drainPerHour = Math.min(
      dirtyCount * DIRTY_HYGIENE_DRAIN_PER_ITEM_PER_HOUR,
      MAX_HYGIENE_DRAIN_PER_HOUR,
    );
    const amount = -(drainPerHour * (totalMinutes / 60));
    dispatchWithGroup(
      dispatch,
      increaseNeedByAmount({ need: 'Hygiene', amount }),
      group,
    );
  }

  // Wrong-size clothing is uncomfortable: each mismatched size step drains the
  // Comfort need; a well-fitted outfit lets Comfort recover toward full.
  const body = newState.present.player.body as BodyAttributes | undefined;
  if (body) {
    const gender = newState.present.player.profile.appearance.gender;
    const fitConfig = {
      sizeSystems: getSizeSystems(),
      estimatedMetrics: getEstimatedMetrics(),
    };
    const totalMismatch = equippedWearables.reduce(
      (sum, w) => sum + evaluateFit(w, body, gender, fitConfig).totalMismatch,
      0,
    );

    const ratePerHour =
      totalMismatch > 0
        ? -Math.min(
            totalMismatch * COMFORT_DRAIN_PER_MISMATCH_PER_HOUR,
            MAX_COMFORT_DRAIN_PER_HOUR,
          )
        : COMFORT_RECOVERY_PER_HOUR;
    dispatchWithGroup(
      dispatch,
      increaseNeedByAmount({
        need: COMFORT_NEED,
        amount: ratePerHour * (totalMinutes / 60),
      }),
      group,
    );
  }
};

export default [clothingPostEffect];
