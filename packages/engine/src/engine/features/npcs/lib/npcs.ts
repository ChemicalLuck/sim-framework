import type { NPC, NpcRelationship } from '@chemicalluck/sim-engine/features/npcs/types';
import { getSkills } from '@chemicalluck/sim-engine/features/player/lib/skills';
import {
  type RNG,
  buildWeightedCDF,
  sample,
  worldRng,
} from '@chemicalluck/sim-engine/features/rng/lib/rng';
import { WeightsBuilder } from '@chemicalluck/sim-engine/features/rng/lib/weights';
import type { Weights } from '@chemicalluck/sim-engine/features/rng/weights.types';
import type { CharacterProfile } from '@chemicalluck/sim-engine/types';

import {
  getAppearanceDisplay,
  getAppearanceWeights,
  resolvePronouns,
  sampleBody,
} from './appearance-config';
import { getProfessions } from './professions';

export interface NpcNames {
  male: string[];
  female: string[];
  surnames: string[];
}

export interface NpcConfig {
  names: NpcNames;
}

export function pickRandom<T>(array: readonly T[], rng: RNG = worldRng): T {
  const index = Math.floor(rng.next() * array.length);
  return array[index];
}

export function pickFeature<K extends string | number>(
  weightMaps: Partial<Weights<K>>[],
  allKeys: readonly K[],
  rng: RNG,
): K {
  const builder = new WeightsBuilder<K>();
  for (const map of weightMaps) builder.merge(map);
  builder.complete(allKeys);
  const weights = builder.build();
  const total = Object.values(weights as Record<string, number>).reduce(
    (s, w) => s + w,
    0,
  );
  if (total <= 0) return pickRandom(allKeys, rng);
  return sample(buildWeightedCDF(weights), rng);
}

export class NpcFactory {
  private readonly names: NpcNames;

  constructor(config: NpcConfig) {
    this.names = config.names;
  }

  create(rng: RNG): NPC {
    const config = getAppearanceWeights();
    const { names } = this;

    const picked: Record<string, string> = {};

    // Pick dimension features first so others can reference them
    for (const feat of config.features.filter((f) => f.isDimension)) {
      picked[feat.id] = pickFeature(
        [feat.defaultWeights as Weights<string>],
        feat.values,
        rng,
      );
    }

    // Pick remaining features, merging dimension-specific weights
    for (const feat of config.features.filter((f) => !f.isDimension)) {
      const weightMaps: Partial<Weights<string>>[] = [
        feat.defaultWeights as Weights<string>,
      ];
      for (const dimId of config.dimensionIds) {
        const dimVal = picked[dimId];
        if (
          dimVal.length > 0 &&
          dimId in feat.byDimension &&
          dimVal in feat.byDimension[dimId]
        ) {
          weightMaps.push(feat.byDimension[dimId][dimVal] as Weights<string>);
        }
      }
      picked[feat.id] = pickFeature(weightMaps, feat.values, rng);
    }

    // Resolve pronouns from the configured pronoun feature
    const pronouns = resolvePronouns(picked);

    // Name selection based on pronouns noun (man → male names, else female)
    const useMaleNames = pronouns.noun === 'man';
    const namePool =
      useMaleNames && names.male.length
        ? names.male
        : !useMaleNames && names.female.length
          ? names.female
          : names.male.length
            ? names.male
            : ['Alex'];
    const surnames = names.surnames.length ? names.surnames : ['Smith'];

    const firstName = pickRandom(namePool, rng);
    const lastName = pickRandom(surnames, rng);

    const age = pickFeature(
      [config.ages],
      Object.keys(config.ages).map(Number),
      rng,
    );

    const profile: CharacterProfile = {
      firstName,
      lastName,
      profession: WeightsBuilder.uniform(getProfessions()).pick(rng),
      age,
      appearance: picked,
    };

    const skills: Record<string, number> = {};
    for (const def of getSkills()) {
      const [min, max] = def.npcRange ?? [0, 5];
      skills[def.id] = min + Math.floor(rng.next() * (max - min + 1));
    }

    const body = sampleBody(rng, picked);

    return {
      id: crypto.randomUUID(),
      pronouns,
      profile,
      equipment: {},
      skills,
      traits: [],
      body,
    };
  }
}

let _factory = new NpcFactory({
  names: { male: [], female: [], surnames: [] },
});

export function setNpcFactory(factory: NpcFactory): void {
  _factory = factory;
}

export function initNpcNames(names: NpcNames): void {
  setNpcFactory(new NpcFactory({ names }));
}

export function createNpc(rng: RNG): NPC {
  return _factory.create(rng);
}

export function getRelationshipGroup(
  rel: NpcRelationship | undefined,
): 'romantic' | 'friends' | 'acquaintances' | 'strangers' {
  if (!rel) return 'strangers';
  if (rel.relationship.Romance > 0) return 'romantic';
  if (rel.relationship.Friendship > 0) return 'friends';
  return 'acquaintances';
}

export function describeStranger(npc: NPC): string {
  const { age } = npc.profile;
  const display = getAppearanceDisplay();

  const featureVals = display.strangerFeatureIds
    .map((id) => npc.profile.appearance[id])
    .filter(Boolean);

  const genderNoun = resolvePronouns(npc.profile.appearance).noun;

  const ageDesc = age < 30 ? 'young' : age < 50 ? 'middle-aged' : 'older';
  const parts = [ageDesc, ...featureVals, genderNoun];
  const article = /^[aeiou]/i.test(parts[0] ?? '') ? 'An' : 'A';
  return `${article} ${parts.join(' ')}`;
}
