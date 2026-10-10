/**
 * A linear model estimating one body measurement from the player's primary
 * body attributes: `value = intercept + Σ terms[attr] · attr`.
 * Term keys reference entries in `primaryBodyAttributes` (height/weight/bodyFat).
 */
export interface LinearModel {
  intercept: number;
  terms: Partial<Record<string, number>>;
}

/**
 * How a garment-relevant measurement (e.g. waist, underbust, inseam) is
 * estimated from the primary attributes. `byGender` overrides `default` for a
 * matching gender appearance value; `default` is used when gender is unknown.
 */
export interface EstimatedMetric {
  default: LinearModel;
  byGender?: Record<string, LinearModel>;
}

/** One ordered size step: `label` shown to the player, `max` upper bound (inclusive) on the dimension's metric value. */
export interface SizeTier {
  label: string;
  max: number;
}

/** One axis of a size system, sized against a primary or estimated metric. */
export interface SizeDimension {
  name: string;
  metric: string;
  sizes: SizeTier[];
}

/**
 * A named sizing scale. Single-dimension for normal garments (tops, shoes),
 * multi-dimension for compound sizing (trousers waist/length, bras band/cup).
 * `labelFormat` interpolates dimension names, e.g. `"{band}{cup}"` or `"{size}"`.
 */
export interface SizeSystem {
  dimensions: SizeDimension[];
  labelFormat: string;
}

/** Need drained while equipped clothing is dirty. Rates are points per hour. */
export interface ClothingHygieneNeedConfig {
  need: string;
  drainPerDirtyItemPerHour?: number;
  maxDrainPerHour?: number;
}

/** Need drained by ill-fitting clothing and restored by a good fit. Rates are points per hour. */
export interface ClothingComfortNeedConfig {
  need: string;
  drainPerMismatchPerHour?: number;
  maxDrainPerHour?: number;
  recoveryPerHour?: number;
}

/**
 * Which needs worn clothing affects. An omitted entry uses the default need
 * (`Hygiene` / `Comfort`); `null` disables that drain.
 */
export interface ClothingNeedsConfig {
  hygiene?: ClothingHygieneNeedConfig | null;
  comfort?: ClothingComfortNeedConfig | null;
}

export const DEFAULT_CLOTHING_HYGIENE: Required<ClothingHygieneNeedConfig> = {
  need: 'Hygiene',
  drainPerDirtyItemPerHour: 1,
  maxDrainPerHour: 3,
};

export const DEFAULT_CLOTHING_COMFORT: Required<ClothingComfortNeedConfig> = {
  need: 'Comfort',
  drainPerMismatchPerHour: 1.5,
  maxDrainPerHour: 6,
  recoveryPerHour: 5,
};

export interface WearableConfig {
  slots: string[];
  categories: string[];
  slotCategoryMap: Record<string, string>;
  /**
   * Slots that cannot be worn at the same time. Authored once per relationship
   * and treated symmetrically: if `full-body` lists `baselayer`, then equipping
   * either slot clears the other. See {@link conflictingSlots}.
   */
  slotConflicts?: Record<string, string[]>;
  styles: string[];
  appearanceKeys: string[];
  primaryBodyAttributes: string[];
  estimatedMetrics: Record<string, EstimatedMetric>;
  sizeSystems: Record<string, SizeSystem>;
  /** Needs drained by dirty or ill-fitting clothing. See {@link getClothingNeeds}. */
  clothingNeeds?: ClothingNeedsConfig;
}

let _config: WearableConfig = {
  slots: [],
  categories: [],
  slotCategoryMap: {},
  slotConflicts: {},
  styles: [],
  appearanceKeys: [],
  primaryBodyAttributes: [],
  estimatedMetrics: {},
  sizeSystems: {},
};

export function configureWearables(config: WearableConfig) {
  _config = config;
}

export const getSlots = () => _config.slots;
export const getCategories = () => _config.categories;
export const getSlotCategoryMap = () => _config.slotCategoryMap;
export const getSlotConflicts = () => _config.slotConflicts ?? {};
export const getStyles = () => _config.styles;

/**
 * The set of slots that conflict with `slot`, resolved symmetrically from
 * `slotConflicts`: both the slots `slot` declares and any slot that declares
 * `slot`. Equipping into `slot` should clear every slot returned here.
 */
export function conflictingSlots(slot: string): string[] {
  const conflicts = _config.slotConflicts ?? {};
  const result = new Set<string>(conflicts[slot] ?? []);
  for (const [other, against] of Object.entries(conflicts)) {
    if (other !== slot && against.includes(slot)) result.add(other);
  }
  return [...result];
}
export const getAppearanceKeys = () => _config.appearanceKeys;
export const getPrimaryBodyAttributes = () => _config.primaryBodyAttributes;
export const getEstimatedMetrics = () => _config.estimatedMetrics;
export const getSizeSystems = () => _config.sizeSystems;

/** Resolved clothing need config: defaults filled in, `null` where disabled. */
export function getClothingNeeds(): {
  hygiene: Required<ClothingHygieneNeedConfig> | null;
  comfort: Required<ClothingComfortNeedConfig> | null;
} {
  const { hygiene, comfort } = _config.clothingNeeds ?? {};
  return {
    hygiene:
      hygiene === null ? null : { ...DEFAULT_CLOTHING_HYGIENE, ...hygiene },
    comfort:
      comfort === null ? null : { ...DEFAULT_CLOTHING_COMFORT, ...comfort },
  };
}
