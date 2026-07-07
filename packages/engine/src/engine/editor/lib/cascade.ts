interface RawEffect {
  kind?: string;
  questId?: string;
  objectiveName?: string;
  [key: string]: unknown;
}

interface RawAction {
  effects?: RawEffect[];
  [key: string]: unknown;
}

interface RawActionGroup {
  actions?: RawAction[];
  [key: string]: unknown;
}

interface RawWithActions {
  actions?: RawActionGroup[];
  [key: string]: unknown;
}

export interface ObjectiveRename {
  questId: string;
  oldName: string;
  newName: string;
}

function patchActionsEffects(
  actions: RawAction[] | undefined,
  renames: ObjectiveRename[],
): { actions: RawAction[]; count: number } {
  let count = 0;
  const patched = (actions ?? []).map((action) => ({
    ...action,
    effects: (action.effects ?? []).map((fx) => {
      if (fx.kind !== 'quest') return fx;
      const rename = renames.find(
        (r) => r.questId === fx.questId && r.oldName === fx.objectiveName,
      );
      if (!rename) return fx;
      count++;
      return { ...fx, objectiveName: rename.newName };
    }),
  }));
  return { actions: patched, count };
}

function patchGroupedActions(
  groups: RawActionGroup[] | undefined,
  renames: ObjectiveRename[],
): { groups: RawActionGroup[]; count: number } {
  let count = 0;
  const patched = (groups ?? []).map((group) => {
    const { actions, count: c } = patchActionsEffects(group.actions, renames);
    count += c;
    return c > 0 ? { ...group, actions } : group;
  });
  return { groups: patched, count };
}

export function patchObjectiveRenames<T extends RawWithActions>(
  data: T[],
  renames: ObjectiveRename[],
): { patched: T[]; count: number } {
  let total = 0;
  const patched = data.map((item) => {
    const { groups, count } = patchGroupedActions(item.actions, renames);
    total += count;
    return count > 0 ? { ...item, actions: groups } : item;
  });
  return { patched, count: total };
}

export function diffObjectiveRenames(
  oldQuests: { id: string; objectives: { name: string }[] }[],
  newQuests: { id: string; objectives: { name: string }[] }[],
): ObjectiveRename[] {
  const renames: ObjectiveRename[] = [];
  for (const newQ of newQuests) {
    const oldQ = oldQuests.find((q) => q.id === newQ.id);
    if (!oldQ) continue;
    const oldNames = oldQ.objectives.map((o) => o.name);
    const newNames = newQ.objectives.map((o) => o.name);
    // Pair by index — only flag renames when count is the same (no add/remove)
    if (oldNames.length !== newNames.length) continue;
    for (let i = 0; i < oldNames.length; i++) {
      if (oldNames[i] !== newNames[i]) {
        renames.push({
          questId: newQ.id,
          oldName: oldNames[i],
          newName: newNames[i],
        });
      }
    }
  }
  return renames;
}
