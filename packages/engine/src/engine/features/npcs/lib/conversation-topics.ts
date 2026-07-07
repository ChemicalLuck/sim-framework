import type {
  ConversationTopic,
  NpcRelationship,
} from '@chemicalluck/engine/features/npcs/types';
import type { Effect } from '@chemicalluck/engine/types';

let _topics: ConversationTopic[] = [];

export function initConversationTopics(topics: ConversationTopic[]): void {
  _topics = topics;
}

export function getConversationTopics(): ConversationTopic[] {
  return _topics;
}

export function isTopicVisible(
  topic: ConversationTopic,
  rel: NpcRelationship,
  known: boolean,
): boolean {
  const v = topic.visibility;
  if (!v) return true;
  if (v.requireKnown && !known) return false;
  if (v.hideIfKnown && known) return false;
  if (v.minFriendship != null && rel.relationship.Friendship < v.minFriendship)
    return false;
  if (v.minRomance != null && rel.relationship.Romance < v.minRomance)
    return false;
  if (v.minAttraction != null && rel.relationship.Attraction < v.minAttraction)
    return false;
  return true;
}

export function resolveConversationEffects(
  effects: Effect[],
  npcId: string,
): Effect[] {
  return effects.map((e) => {
    const raw = e as unknown as Record<string, unknown>;
    if (raw.npcId === '$npc') return { ...raw, npcId } as unknown as Effect;
    return e;
  });
}
