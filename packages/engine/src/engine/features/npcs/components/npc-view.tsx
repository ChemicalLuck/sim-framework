import { ActionButton } from '@chemicalluck/engine/components/action-button';
import { NpcMeta } from '@chemicalluck/engine/components/npc-meta';
import WithSidebar from '@chemicalluck/engine/components/with-sidebar';
import { getAppearanceLists } from '@chemicalluck/engine/features/npcs/lib/appearance-config';
import { describeStranger } from '@chemicalluck/engine/features/npcs/lib/npcs';
import { selectNpcById } from '@chemicalluck/engine/features/npcs/selectors';
import {
  selectNpcKnown,
  selectNpcRelationship,
} from '@chemicalluck/engine/features/relationships/selectors';
import * as effects from '@chemicalluck/engine/features/view/helpers';
import { useEngineSelector } from '@chemicalluck/engine/state/store';

interface NpcViewProps {
  npcId: string;
}

function NpcView({ npcId }: NpcViewProps) {
  const npc = useEngineSelector(selectNpcById(npcId));
  const { relationship } = useEngineSelector(selectNpcRelationship(npcId));
  const known = useEngineSelector(selectNpcKnown(npcId));

  if (!npc) {
    return (
      <WithSidebar>
        <p>Person not found.</p>
        <ActionButton effects={effects.viewDefault()}>Go back</ActionButton>
      </WithSidebar>
    );
  }

  const { profile, traits } = npc;
  const appearanceFeatures = getAppearanceLists();

  return (
    <WithSidebar>
      <h2 className="text-2xl font-bold mb-1">
        {!known
          ? describeStranger(npc)
          : `${profile.firstName} ${profile.lastName}`}
      </h2>
      <NpcMeta npc={npc} />

      {appearanceFeatures.length > 0 && (
        <section className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Appearance
          </h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {appearanceFeatures.map((feat) => (
              <div key={feat.id} className="contents">
                <dt className="text-muted-foreground">{feat.label}</dt>
                <dd>{profile.appearance[feat.id] ?? '—'}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {traits.length > 0 && (
        <section className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Traits
          </h3>
          <p className="text-sm">{traits.join(', ')}</p>
        </section>
      )}

      <section className="mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Relationship
        </h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {Object.entries(relationship).map(([metric, value]) => (
            <div key={`${metric}-dt`}>
              <dt className="text-muted-foreground">{metric}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="flex gap-2">
        <ActionButton effects={effects.viewConversation(npcId)}>
          Talk
        </ActionButton>
        <ActionButton effects={effects.viewDefault()}>Go back</ActionButton>
      </div>
    </WithSidebar>
  );
}

export default NpcView;
