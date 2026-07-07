import { buildTemplateContext } from '@chemicalluck/engine/features/linguistics/lib/context';
import {
  type TemplateContext,
  renderText,
} from '@chemicalluck/engine/features/linguistics/lib/template';
import type { NPC } from '@chemicalluck/engine/features/npcs/types';
import type { Quest, QuestTemplate } from '@chemicalluck/engine/features/quests/types';

let _templates: QuestTemplate[] = [];

export function initQuestTemplates(templates: QuestTemplate[]): void {
  _templates = templates;
}

export function getQuestTemplate(
  templateId: string,
): QuestTemplate | undefined {
  return _templates.find((t) => t.id === templateId);
}

function resolveDeep<T>(value: T, ctx: TemplateContext): T {
  if (typeof value === 'string') return renderText(value, ctx) as T;
  if (Array.isArray(value))
    return (value as unknown[]).map((v) =>
      resolveDeep(v as T, ctx),
    ) as unknown as T;
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, resolveDeep(v, ctx)]),
    ) as T;
  return value;
}

export function instantiateQuestTemplate(
  template: QuestTemplate,
  npc: NPC,
): Quest {
  const ctx = buildTemplateContext({
    npcs: [
      { profile: npc.profile, body: npc.body, pronouns: { ...npc.pronouns } },
    ],
  });
  return {
    id: renderText(template.idTemplate, ctx),
    name: renderText(template.name, ctx),
    objectives: template.objectives.map((o) => ({
      ...o,
      name: renderText(o.name, ctx),
      ...(o.onComplete && { onComplete: resolveDeep(o.onComplete, ctx) }),
    })),
  };
}
