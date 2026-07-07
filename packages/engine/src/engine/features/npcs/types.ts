import type { Character } from '@chemicalluck/engine/types/character.types';
import type { BaseEffect, Effect } from '@chemicalluck/engine/types/effect.types';
import type { NpcFilter } from '@chemicalluck/engine/types/npc-filter.types';

export type JsonNpcSelection =
  | { npcIds: string[] }
  | { npcCount: number; npcFilters?: NpcFilter[][] };

export interface Pronouns {
  subject: string; // he / she / they
  object: string; // him / her / them
  possessive: string; // his / her / their
  reflexive: string; // himself / herself / themself
  noun: string; // man / woman / person
}

export type RelationshipMetric = 'Friendship' | 'Romance' | 'Attraction';

export interface NpcRelationship {
  relationship: Record<RelationshipMetric, number>;
}

export interface NPC extends Character {
  pronouns: Pronouns;
}

export interface ConversationTopicVisibility {
  requireKnown?: boolean;
  hideIfKnown?: boolean;
  minFriendship?: number;
  minRomance?: number;
  minAttraction?: number;
}

/**
 * A conversation topic loaded from conversations.json.
 * In `response` and `label`, use unified template tokens: {npc0.firstName},
 * {npc0.name}, {npc0.subject}, {cap:npc0.subject}, {npc0.profession}, etc.
 * In `effects`, use npcId "$npc" to refer to the current NPC at runtime.
 */
export interface ConversationTopic {
  id: string;
  label: string;
  visibility?: ConversationTopicVisibility;
  response: string;
  effects?: Effect[];
}

export interface NpcScheduleEntry {
  locationId: string;
  after: number;
  before: number;
}

export interface NamedNpcDefinition extends NPC {
  schedule?: NpcScheduleEntry[];
  topics?: ConversationTopic[];
}

export interface NpcEffect extends BaseEffect<'npc'> {
  readonly npcId: string;
  readonly operation: 'meet';
}

declare module '@chemicalluck/engine/types/effect.types' {
  interface EffectMap {
    npc: NpcEffect;
  }
}
