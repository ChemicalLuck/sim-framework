export interface ClothingItemState {
  isWet: boolean;
  isDirty: boolean;
  wearMinutes: number;
}

export type ClothingState = Record<string, ClothingItemState | undefined>;

export const DIRTY_THRESHOLD_MINUTES = 480;

export const WET_WEATHER_CONDITIONS = new Set(['light_rain', 'rainy', 'snowy']);

export const UMBRELLA_SLOT = 'umbrella';

export interface HasDirtyClothesCondition {
  kind: 'has_dirty_clothes';
}

export interface HasWetClothesCondition {
  kind: 'has_wet_clothes';
}
