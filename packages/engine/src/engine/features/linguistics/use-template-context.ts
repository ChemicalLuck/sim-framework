import { useMemo } from 'react';

import { resolvePronouns } from '@chemicalluck/sim-engine/features/npcs/lib/appearance-config';
import type { NPC } from '@chemicalluck/sim-engine/features/npcs/types';
import { useEngineSelector } from '@chemicalluck/sim-engine/state/store';

import { selectExtensionTemplateVars } from './extension-vars-selector';
import { type EntityInput, buildTemplateContext } from './lib/context';
import type { TemplateContext } from './lib/template';
import { selectNarrativeVars } from './selectors';

/**
 * Build a unified template context for the current player + the given NPCs
 * (exposed as `npc0`, `npc1`, …) plus global narrative variables and
 * extension-provided ones (`{<extension>.<key>}`). Use the
 * returned context with `renderText` to interpolate scene/conversation text.
 */
export function useTemplateContext(
  npcs: (NPC | undefined)[] = [],
  known: boolean[] = [],
): TemplateContext {
  const profile = useEngineSelector((s) => s.present.player.profile);
  const body = useEngineSelector((s) => s.present.player.body);
  const narrativeVars = useEngineSelector(selectNarrativeVars);
  const extensionVars = useEngineSelector(selectExtensionTemplateVars);
  const wordChoices = useEngineSelector(
    (s) => s.present.linguistics.wordChoices,
  );
  const seed = useEngineSelector((s) => s.present.rng.seed);

  return useMemo(
    () =>
      buildTemplateContext({
        player: {
          profile,
          body,
          pronouns: { ...resolvePronouns(profile.appearance) },
        },
        npcs: npcs.map((npc, i): EntityInput | undefined =>
          npc
            ? {
                profile: npc.profile,
                body: npc.body,
                pronouns: { ...npc.pronouns },
                known: known[i],
              }
            : undefined,
        ),
        narrativeVars: { ...narrativeVars, ...extensionVars },
        wordChoices,
        seed,
      }),
    [
      profile,
      body,
      narrativeVars,
      extensionVars,
      wordChoices,
      seed,
      npcs,
      known,
    ],
  );
}
