import { buildTemplateContext } from '@chemicalluck/sim-engine/features/linguistics/lib/context';
import {
  type TemplateContext,
  renderText,
} from '@chemicalluck/sim-engine/features/linguistics/lib/template';
import type { NPC } from '@chemicalluck/sim-engine/features/npcs/types';
import type {
  ObjectiveCondition,
  ObjectiveTrigger,
  Quest,
  QuestTemplate,
} from '@chemicalluck/sim-engine/features/quests/types';

let _templates: QuestTemplate[] = [];

export function initQuestTemplates(templates: QuestTemplate[]): void {
  _templates = templates;
}

export function getQuestTemplate(
  templateId: string,
): QuestTemplate | undefined {
  return _templates.find((t) => t.id === templateId);
}

// Hydrated content an effect points at (a view's scene/script/shop, an
// inventory item) is shared with the rest of the game: keep it as is rather
// than copying it and rendering its text against the template's NPC.
const HYDRATED_KEYS = new Set(['props', 'item']);

function resolveDeep<T>(value: T, ctx: TemplateContext): T {
  if (typeof value === 'string') return renderText(value, ctx) as T;
  if (Array.isArray(value))
    return (value as unknown[]).map((v) =>
      resolveDeep(v as T, ctx),
    ) as unknown as T;
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        HYDRATED_KEYS.has(k) ? v : resolveDeep(v, ctx),
      ]),
    ) as T;
  return value;
}

/**
 * Render an objective's trigger or condition: the strings of a condition, or
 * of an action (text, condition, effects). A scene objective is hydrated
 * content too — a scenes.json scene shared with the rest of the game, or an
 * inline one whose text is rendered against its own NPCs when shown — so it
 * is kept as is.
 */
function resolvePart<T extends ObjectiveTrigger | ObjectiveCondition>(
  part: T,
  ctx: TemplateContext,
): T {
  return part.kind === 'scene' ? part : resolveDeep(part, ctx);
}

/**
 * Whether a template string holds a `{npc0…}` token (e.g. `meet_{npc0.id}`),
 * the part {@link instantiateQuestTemplate} fills per NPC.
 */
export function hasNpcToken(template: string): boolean {
  return /\{npc0\.[^{}]+\}/.test(template);
}

export function instantiateQuestTemplate(
  template: QuestTemplate,
  npc: NPC,
): Quest {
  const ctx = buildTemplateContext({
    npcs: [
      {
        id: npc.id,
        profile: npc.profile,
        body: npc.body,
        pronouns: { ...npc.pronouns },
      },
    ],
  });
  return {
    id: renderText(template.idTemplate, ctx),
    name: renderText(template.name, ctx),
    objectives: template.objectives.map((o) => ({
      ...o,
      name: renderText(o.name, ctx),
      ...(o.trigger && { trigger: resolvePart(o.trigger, ctx) }),
      condition: resolvePart(o.condition, ctx),
      ...(o.onComplete && { onComplete: resolveDeep(o.onComplete, ctx) }),
    })),
  };
}
