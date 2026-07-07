import type { BodyAttributes, CharacterProfile } from '@sim/engine/types';

import { getMacros, getTerms } from './config';
import type { TemplateContext } from './template';

/** A character flattened for templating: profile, optional body, pronouns, known-ness. */
export interface EntityInput {
  profile: CharacterProfile;
  body?: BodyAttributes;
  /** Pronoun fields (subject/object/possessive/reflexive/noun). */
  pronouns: Record<string, string>;
  /** Whether the player has met this character; `false` renders `name` as "They". */
  known?: boolean;
}

/**
 * Flatten a character into template variables under `prefix` (e.g. `npc0` →
 * `npc0.firstName`; `''` → bare `firstName`). Exposes name parts, profession,
 * age, appearance feature values, body attributes and pronoun fields.
 */
export function buildEntityVars(
  prefix: string,
  entity: EntityInput,
): Record<string, string | number> {
  const { profile, body, pronouns, known } = entity;
  const p = prefix ? `${prefix}.` : '';
  const vars: Record<string, string | number> = {
    [`${p}firstName`]: profile.firstName,
    [`${p}lastName`]: profile.lastName,
    [`${p}fullName`]: `${profile.firstName} ${profile.lastName}`.trim(),
    [`${p}name`]: known === false ? 'They' : profile.firstName,
    [`${p}profession`]: profile.profession,
    [`${p}age`]: profile.age,
  };
  for (const [key, value] of Object.entries(profile.appearance)) {
    vars[`${p}${key}`] = value;
  }
  if (body) {
    const bodyRecord = body as unknown as Record<string, number>;
    for (const [key, value] of Object.entries(bodyRecord)) {
      vars[`${p}${key}`] = value;
    }
  }
  for (const [key, value] of Object.entries(pronouns)) {
    vars[`${p}${key}`] = value;
  }
  return vars;
}

export interface BuildContextArgs {
  /** The player — exposed bare (`{height}`) and namespaced as both `{player.height}` and the short `{p.height}` used in authoring surfaces. Optional for player-less contexts (e.g. quest instantiation). */
  player?: EntityInput;
  /** Characters exposed as `npc0`, `npc1`, … (index = slot). */
  npcs?: (EntityInput | undefined)[];
  /** Global narrative variables (weather, timeOfDay, totalNearbyNpcs, …). */
  narrativeVars?: Record<string, string | number>;
  wordChoices?: Record<string, string>;
  seed?: string | number;
}

/**
 * Assemble a full template context from the player, nearby/active NPCs and
 * global narrative variables. Pure — usable from selectors, hooks and thunks.
 */
export function buildTemplateContext(args: BuildContextArgs): TemplateContext {
  const vars: Record<string, string | number> = {
    ...(args.player ? buildEntityVars('', args.player) : {}),
    ...(args.player ? buildEntityVars('player', args.player) : {}),
    ...(args.player ? buildEntityVars('p', args.player) : {}),
    ...(args.narrativeVars ?? {}),
  };
  (args.npcs ?? []).forEach((npc, i) => {
    if (npc) Object.assign(vars, buildEntityVars(`npc${String(i)}`, npc));
  });
  return {
    vars,
    wordChoices: args.wordChoices ?? {},
    seed: args.seed ?? '',
    macros: getMacros(),
    terms: getTerms(),
  };
}
