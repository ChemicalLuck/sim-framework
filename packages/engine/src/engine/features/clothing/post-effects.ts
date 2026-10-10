import {
  type EffectContext,
  dispatchWithGroup,
} from '@chemicalluck/sim-engine/features/core/types';
import { increaseNeedByAmount } from '@chemicalluck/sim-engine/features/needs/slice';
import { evaluateFit } from '@chemicalluck/sim-engine/features/outfits/lib/fit';
import {
  getClothingNeeds,
  getEstimatedMetrics,
  getSizeSystems,
} from '@chemicalluck/sim-engine/features/outfits/lib/wearable-config';
import { getLocationById } from '@chemicalluck/sim-engine/features/travel/lib/world';
import { selectWeatherConditionId } from '@chemicalluck/sim-engine/features/weather/selectors';
import type { WeatherConditionId } from '@chemicalluck/sim-engine/features/weather/types';
import type { PostEffectHandler } from '@chemicalluck/sim-engine/state/thunks';
import type { BodyAttributes } from '@chemicalluck/sim-engine/types/character.types';

import clothingReducer, { addWearMinutes, ensureItems, setWet } from './slice';
import { UMBRELLA_SLOT, WET_WEATHER_CONDITIONS } from './types';

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

  // newState predates the wear-time update below, so fold the same actions
  // through the reducer to see which items are dirty after it.
  const ensure = ensureItems(equippedIds);
  const wear = addWearMinutes({ ids: equippedIds, minutes: totalMinutes });
  dispatchWithGroup(dispatch, ensure, group);
  dispatchWithGroup(dispatch, wear, group);
  const clothing = clothingReducer(
    clothingReducer(newState.present.clothing, ensure),
    wear,
  );

  const effectiveId: WeatherConditionId = selectWeatherConditionId(newState);

  const isProtected = equipment[UMBRELLA_SLOT] != null;
  const isWetWeather = WET_WEATHER_CONDITIONS.has(effectiveId);
  const currentLocation = getLocationById(newState.present.player.locationId);
  const isOutdoors = currentLocation?.kind !== 'interior';

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

  const { hygiene, comfort } = getClothingNeeds();

  const dirtyCount = equippedIds.filter(
    (id) => clothing[id]?.isDirty ?? false,
  ).length;

  if (hygiene && dirtyCount > 0) {
    const drainPerHour = Math.min(
      dirtyCount * hygiene.drainPerDirtyItemPerHour,
      hygiene.maxDrainPerHour,
    );
    const amount = -(drainPerHour * (totalMinutes / 60));
    dispatchWithGroup(
      dispatch,
      increaseNeedByAmount({ need: hygiene.need, amount }),
      group,
    );
  }

  // Wrong-size clothing is uncomfortable: each mismatched size step drains the
  // comfort need; a well-fitted outfit lets it recover toward full.
  const body = newState.present.player.body as BodyAttributes | undefined;
  if (comfort && body) {
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
            totalMismatch * comfort.drainPerMismatchPerHour,
            comfort.maxDrainPerHour,
          )
        : comfort.recoveryPerHour;
    dispatchWithGroup(
      dispatch,
      increaseNeedByAmount({
        need: comfort.need,
        amount: ratePerHour * (totalMinutes / 60),
      }),
      group,
    );
  }
};

export default [clothingPostEffect];
