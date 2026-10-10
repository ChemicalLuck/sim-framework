import type {
  Wearable,
  WearableAppearance,
  WearableTemplate,
} from '@chemicalluck/sim-engine/types';

function descriptionFromWearableAppearance(
  appearance: WearableAppearance,
): string {
  return JSON.stringify(appearance);
}

export function generateWearableFromTemplate(
  template: WearableTemplate,
  appearance: WearableAppearance,
  size?: string,
): Wearable {
  const idParts = [template.name, ...Object.values(appearance)];
  if (size) idParts.push(size);
  return {
    kind: 'wearable',
    id: idParts.join('-').toLowerCase().replace(/\s+/g, '_'),
    name: template.name,
    description: descriptionFromWearableAppearance(appearance),
    value: template.value,
    slot: template.slot,
    coverage: template.coverage ?? 0,
    style: template.style,
    appearance: appearance,
    sizeSystem: template.sizeSystem,
    size: size,
    ...(template.warmth != null && { warmth: template.warmth }),
    ...(template.attributes && { attributes: { ...template.attributes } }),
  };
}

/** Numeric fields on Wearable itself; any other name is read from `attributes`. */
const FIRST_CLASS_NUMERIC = new Set(['warmth', 'coverage', 'value']);

/** A wearable's numeric value for `attribute`, or 0 when absent or non-numeric. */
export function wearableAttributeValue(
  wearable: Wearable,
  attribute: string,
): number {
  const value: unknown = FIRST_CLASS_NUMERIC.has(attribute)
    ? wearable[attribute as 'warmth' | 'coverage' | 'value']
    : wearable.attributes?.[attribute];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** Sum of `attribute` across the equipped wearables (e.g. total warmth). */
export function equippedAttributeTotal(
  equipment: Partial<Record<string, Wearable | null>>,
  attribute: string,
): number {
  return Object.values(equipment).reduce(
    (sum, w) => sum + (w ? wearableAttributeValue(w, attribute) : 0),
    0,
  );
}
