import type { Effect, Scene, Script } from '@chemicalluck/sim-engine/types';

export const viewDefault = (): Effect[] => [
  { kind: 'view', activeViewId: 'DefaultView', props: {} },
];

export const viewScene = (scene: Scene): Effect[] => [
  { kind: 'view', activeViewId: 'SceneView', props: { scene } },
];

export const viewOutfits = (): Effect[] => [
  { kind: 'view', activeViewId: 'OutfitView', props: {} },
];

export const viewScript = (script: Script): Effect[] => [
  { kind: 'view', activeViewId: 'ScriptView', props: { script } },
];

export const viewNpc = (npcId: string): Effect[] => [
  { kind: 'view', activeViewId: 'NpcView', props: { npcId } },
];

export const viewConversation = (npcId: string): Effect[] => [
  { kind: 'view', activeViewId: 'ConversationView', props: { npcId } },
];

const SCALED_FIELDS = ['delta', 'amount'] as const;

/** Scale an effect's numeric `delta`/`amount` (money, needs, skills, …). */
function scaleAmount(effect: Effect, factor: number): Effect {
  const scaled: Record<string, unknown> = { ...effect };
  for (const field of SCALED_FIELDS) {
    const v = scaled[field];
    if (typeof v === 'number')
      scaled[field] = Math.round(v * factor * 100) / 100;
  }
  return scaled as unknown as Effect;
}

/**
 * Effects for leaving a script after `turnsCompleted` of its scenes: the
 * script's leave effects, plus its completion effects scaled by progress when
 * `leave.scaleCompletionEffects` is set. Returns to the default view unless one
 * of those effects already changes the view. Time needs no adjustment: each
 * completed turn has already advanced the clock.
 */
export function earlyExitEffects(
  script: Script,
  turnsCompleted: number,
): Effect[] {
  const leave = script.leave ?? {};
  const fx: Effect[] = [...(leave.effects ?? [])];
  if (leave.scaleCompletionEffects) {
    const factor = Math.min(1, turnsCompleted / script.scenes.length);
    fx.push(
      ...(script.completionEffects ?? []).map((e) => scaleAmount(e, factor)),
    );
  }
  if (!fx.some((e) => e.kind === 'view')) fx.push(...viewDefault());
  return fx;
}
