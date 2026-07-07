import { getAppearanceDisplay } from '@sim/engine/features/npcs/lib/appearance-config';
import type { NPC } from '@sim/engine/features/npcs/types';

interface NpcMetaProps {
  npc: NPC;
}

export function NpcMeta({ npc }: NpcMetaProps) {
  const { profile, pronouns } = npc;
  const display = getAppearanceDisplay();

  const metaFeatures = display.metaFeatureIds
    .map((id) => profile.appearance[id])
    .filter(Boolean)
    .join(' · ');

  return (
    <p className="text-sm text-muted-foreground mb-6">
      {profile.age} years old &middot; {profile.profession}
      {metaFeatures ? ` · ${metaFeatures}` : ''} ({pronouns.subject}/
      {pronouns.object})
    </p>
  );
}
