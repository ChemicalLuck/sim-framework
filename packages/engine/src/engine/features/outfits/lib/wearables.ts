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
  };
}
