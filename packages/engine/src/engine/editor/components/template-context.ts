import { getMacros, getTerms } from '@sim/engine/features/linguistics/lib/config';
import type { TemplateLintContext } from '@sim/engine/features/linguistics/lib/lint';
import { entityAwareVariableNames } from '@sim/engine/features/linguistics/lib/variables';
import { getAppearanceLists } from '@sim/engine/features/npcs/lib/appearance-config';

/**
 * Lint/highlight context for entity-aware prose fields (scenes, conversations,
 * quests, encounters, …): the player + `npc0..npc2` characters, all appearance
 * feature ids, global narrative vars, and the configured macros/terms.
 */
export function editorTemplateContext(): TemplateLintContext {
  const featureIds = getAppearanceLists().map((f) => f.id);
  return {
    variables: entityAwareVariableNames(featureIds),
    macros: [...getMacros().entries()].map(([name, { params }]) => ({
      name,
      params,
    })),
    terms: [...getTerms().keys()],
  };
}
