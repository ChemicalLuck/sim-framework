import type {
  ConversationTopic,
  NPC,
  NamedNpcDefinition,
} from '@sim/engine/features/npcs/types';

let _defs: NamedNpcDefinition[] = [];

export function setNamedNpcs(defs: NamedNpcDefinition[]): void {
  _defs = defs;
}

export function getNamedNpcs(): NPC[] {
  return _defs;
}

export function getNamedNpcTopics(npcId: string): ConversationTopic[] {
  return _defs.find((d) => d.id === npcId)?.topics ?? [];
}

export function getNamedNpcDefs(): NamedNpcDefinition[] {
  return _defs;
}
