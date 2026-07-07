import { useMemo } from 'react';
import { resolvePronouns } from '@chemicalluck/engine/features/npcs/lib/appearance-config';
import type { NPC } from '@chemicalluck/engine/features/npcs/types';
import { useEngineSelector } from '@chemicalluck/engine/state/store';

import { type EntityInput, buildTemplateContext } from './lib/context';
import type { TemplateContext } from './lib/template';
import { selectNarrativeVars } from './selectors';

/**
 * Build a unified template context for the current player + the given NPCs
 * (exposed as `npc0`, `npc1`, …) plus global narrative variables. Use the
 * returned context with `renderText` to interpolate scene/conversation text.
 */
export function useTemplateContext(
  npcs: (NPC | undefined)[] = [],
  known: boolean[] = [],
): TemplateContext {
  const profile = useEngineSelector((s) => s.present.player.profile);
  const body = useEngineSelector((s) => s.present.player.body);
  const narrativeVars = useEngineSelector(selectNarrativeVars);
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
        narrativeVars,
        wordChoices,
        seed,
      }),
    [profile, body, narrativeVars, wordChoices, seed, npcs, known],
  );
}
