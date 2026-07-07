import { ActionButton } from '@chemicalluck/engine/components/action-button';
import { ActionButtonList } from '@chemicalluck/engine/components/action-button-list';
import { NpcMeta } from '@chemicalluck/engine/components/npc-meta';
import WithSidebar from '@chemicalluck/engine/components/with-sidebar';
import {
  type TemplateContext,
  renderText,
} from '@chemicalluck/engine/features/linguistics/lib/template';
import { useTemplateContext } from '@chemicalluck/engine/features/linguistics/use-template-context';
import {
  getConversationTopics,
  isTopicVisible,
  resolveConversationEffects,
} from '@chemicalluck/engine/features/npcs/lib/conversation-topics';
import { getNamedNpcTopics } from '@chemicalluck/engine/features/npcs/lib/named-npcs';
import { describeStranger } from '@chemicalluck/engine/features/npcs/lib/npcs';
import { selectNpcById } from '@chemicalluck/engine/features/npcs/selectors';
import type {
  ConversationTopic,
  NPC,
  NpcRelationship,
} from '@chemicalluck/engine/features/npcs/types';
import {
  selectNpcKnown,
  selectNpcRelationship,
} from '@chemicalluck/engine/features/relationships/selectors';
import * as effects from '@chemicalluck/engine/features/view/helpers';
import { selectDescription } from '@chemicalluck/engine/features/view/selectors';
import { useEngineSelector } from '@chemicalluck/engine/state/store';
import type { Action } from '@chemicalluck/engine/types';

const topicToAction = (
  topic: ConversationTopic,
  npc: NPC,
  ctx: TemplateContext,
  rel: NpcRelationship,
  known: boolean,
): Action | undefined => {
  if (!isTopicVisible(topic, rel, known)) return;
  const label = renderText(topic.label, ctx);
  const response = renderText(topic.response, ctx);
  const topicEffects = resolveConversationEffects(topic.effects ?? [], npc.id);
  return {
    kind: 'action',
    text: label,
    effects: [
      ...topicEffects,
      { kind: 'desc', text: response },
      { kind: 'time', minutes: 2 },
    ],
  };
};

interface ConversationViewProps {
  npcId: string;
}

function ConversationView({ npcId }: ConversationViewProps) {
  const npc = useEngineSelector(selectNpcById(npcId));
  const rel = useEngineSelector(selectNpcRelationship(npcId));
  const known = useEngineSelector(selectNpcKnown(npcId));
  const description = useEngineSelector(selectDescription);
  const ctx = useTemplateContext(npc ? [npc] : [], [known]);

  if (!npc) {
    return (
      <WithSidebar>
        <p>Person not found.</p>
        <ActionButton effects={effects.viewDefault()}>Go back</ActionButton>
      </WithSidebar>
    );
  }

  const allTopics = [...getNamedNpcTopics(npcId), ...getConversationTopics()];
  const actions = allTopics
    .map((t) => topicToAction(t, npc, ctx, rel, known))
    .filter((a) => a !== undefined);

  const { profile } = npc;
  const displayName = known
    ? `${profile.firstName} ${profile.lastName}`
    : describeStranger(npc);

  return (
    <WithSidebar>
      <h2 className="text-2xl font-bold mb-1">{displayName}</h2>
      <NpcMeta npc={npc} />

      <p>{description}</p>

      <ActionButtonList actions={actions} />
      <ActionButton effects={effects.viewNpc(npcId)}>Say goodbye</ActionButton>
    </WithSidebar>
  );
}

export default ConversationView;
