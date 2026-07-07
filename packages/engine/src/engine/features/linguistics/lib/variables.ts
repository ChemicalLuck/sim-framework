/**
 * Static identifiers known to the template language, shared by the runtime
 * engine (`template.ts`), the global-variable selector (`selectNarrativeVars`)
 * and the editor linter (`lint.ts`) so they cannot drift apart.
 */

/** Pronoun-field tokens (`{noun}`, `{subject}`, …); valid only as bare tokens. */
export const PRONOUN_FIELDS: string[] = [
  'subject',
  'object',
  'possessive',
  'reflexive',
  'noun',
];

/** Player/NPC body attributes usable as numeric variables. */
export const BODY_VAR_NAMES: string[] = [
  'height',
  'weight',
  'bodyFat',
  'bustDifference',
];

/** Global narrative variables produced by `selectNarrativeVars`. */
export const NARRATIVE_VAR_NAMES: string[] = [
  'timeOfDay',
  'hour',
  'weather',
  'weatherLabel',
  'season',
  'temperature',
  'totalNearbyNpcs',
];

/** Variables available in every template before character-specific feature ids. */
export function baseTemplateVariableNames(): string[] {
  return ['age', ...BODY_VAR_NAMES, ...PRONOUN_FIELDS, ...NARRATIVE_VAR_NAMES];
}

/** Per-character fields addressable as `{npc0.<field>}` / `{player.<field>}`. */
export const ENTITY_FIELD_NAMES: string[] = [
  'firstName',
  'lastName',
  'fullName',
  'name',
  'profession',
  'age',
  ...BODY_VAR_NAMES,
  ...PRONOUN_FIELDS,
];

/** Default entity prefixes the editor validates against (player + a few NPC slots). */
export const ENTITY_PREFIXES: string[] = ['player', 'npc0', 'npc1', 'npc2'];

/** Short prefix the player is addressed by in authoring surfaces (`{p.age}`). */
export const PLAYER_PREFIX = 'p';

/**
 * Player fields exposed behind the `p.` prefix. Used by authoring surfaces that
 * describe the player (e.g. the linguistics editor) so player attributes live
 * under `p.` instead of polluting the bare/global namespace. `featureIds` are
 * the appearance feature ids, also addressable as `p.<id>`.
 */
export function playerVariableNames(featureIds: string[] = []): string[] {
  return [...ENTITY_FIELD_NAMES, ...featureIds].map(
    (field) => `${PLAYER_PREFIX}.${field}`,
  );
}

/**
 * All variable names valid in an entity-aware surface (scenes, conversations,
 * quests…): globals + bare player fields, plus `${prefix}.${field}` for each
 * character prefix. `featureIds` are appearance feature ids, valid both bare
 * (player) and namespaced.
 */
export function entityAwareVariableNames(
  featureIds: string[] = [],
  prefixes: string[] = ENTITY_PREFIXES,
): string[] {
  const entityFields = [...ENTITY_FIELD_NAMES, ...featureIds];
  const dotted = prefixes.flatMap((prefix) =>
    entityFields.map((field) => `${prefix}.${field}`),
  );
  return [
    ...baseTemplateVariableNames(),
    ...featureIds,
    ...NARRATIVE_VAR_NAMES,
    ...dotted,
  ];
}
