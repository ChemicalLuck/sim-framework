import { ActionButton } from '@sim/engine/components/action-button';
import { ActionButtonList } from '@sim/engine/components/action-button-list';
import { NpcMeta } from '@sim/engine/components/npc-meta';
import WithSidebar from '@sim/engine/components/with-sidebar';
import {
  type TemplateContext,
  renderText,
} from '@sim/engine/features/linguistics/lib/template';
import { useTemplateContext } from '@sim/engine/features/linguistics/use-template-context';
import {
  getConversationTopics,
  isTopicVisible,
  resolveConversationEffects,
} from '@sim/engine/features/npcs/lib/conversation-topics';
import { getNamedNpcTopics } from '@sim/engine/features/npcs/lib/named-npcs';
import { describeStranger } from '@sim/engine/features/npcs/lib/npcs';
import { selectNpcById } from '@sim/engine/features/npcs/selectors';
import type {
  ConversationTopic,
  NPC,
  NpcRelationship,
} from '@sim/engine/features/npcs/types';
import {
  selectNpcKnown,
  selectNpcRelationship,
} from '@sim/engine/features/relationships/selectors';
import * as effects from '@sim/engine/features/view/helpers';
import { selectDescription } from '@sim/engine/features/view/selectors';
import { useEngineSelector } from '@sim/engine/state/store';
import type { Action } from '@sim/engine/types';

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
