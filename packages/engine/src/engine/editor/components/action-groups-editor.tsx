import { X } from 'lucide-react';
import { Button } from '@chemicalluck/sim-engine/components/ui/button';
import { Label } from '@chemicalluck/sim-engine/components/ui/label';
import type { ActionGroup } from '@chemicalluck/sim-engine/types';
import type { Action } from '@chemicalluck/sim-engine/types/action.types';

import type { AvailableData } from '../lib/use-available-data';
import { ActionRow } from './action-row';
import { editorTemplateContext } from './template-context';
import { TemplateEditor } from './template-editor';

interface ActionGroupsEditorProps {
  groups: ActionGroup[];
  onChange: (groups: ActionGroup[]) => void;
  availableData?: AvailableData;
}

export function ActionGroupsEditor({
  groups,
  onChange,
  availableData,
}: ActionGroupsEditorProps) {
  function addGroup() {
    onChange([
      ...groups,
      { actions: [{ kind: 'action' as const, text: '', effects: [] }] },
    ]);
  }

  function removeGroup(gi: number) {
    onChange(groups.filter((_, i) => i !== gi));
  }

  function updateGroup(gi: number, updated: ActionGroup) {
    onChange(groups.map((g, i) => (i === gi ? updated : g)));
  }

  function addAction(gi: number) {
    const group = groups[gi];
    updateGroup(gi, {
      ...group,
      actions: [
        ...group.actions,
        { kind: 'action' as const, text: '', effects: [] },
      ],
    });
  }

  function updateAction(gi: number, ai: number, updated: Action) {
    const group = groups[gi];
    updateGroup(gi, {
      ...group,
      actions: group.actions.map((a, i) => (i === ai ? updated : a)),
    });
  }

  function removeAction(gi: number, ai: number) {
    const group = groups[gi];
    const actions = group.actions.filter((_, i) => i !== ai);
    if (actions.length === 0) {
      removeGroup(gi);
    } else {
      updateGroup(gi, { ...group, actions });
    }
  }

  const totalActions = groups.reduce((sum, g) => sum + g.actions.length, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>Actions ({totalActions})</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={addGroup}
          className="h-6 text-xs text-zinc-500 hover:text-zinc-300"
        >
          + Add group
        </Button>
      </div>

      {groups.map((group, gi) => (
        <div
          // eslint-disable-next-line react-x/no-array-index-key
          key={gi}
          className="border border-zinc-700 rounded-md overflow-hidden"
        >
          <div className="flex gap-2 px-3 py-2 bg-zinc-800">
            <div className="flex-1 min-w-0">
              <TemplateEditor
                value={group.pretext ?? ''}
                onChange={(v) => {
                  updateGroup(gi, { ...group, pretext: v || undefined });
                }}
                context={editorTemplateContext()}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                removeGroup(gi);
              }}
              className="h-6 w-6 p-0 text-zinc-600 hover:text-red-400 shrink-0 self-start mt-0.5"
              title="Remove group"
            >
              <X size={12} />
            </Button>
          </div>

          <div className="p-2 bg-zinc-900 border-t border-zinc-700/50 space-y-2">
            {group.actions.map((action, ai) => (
              <ActionRow
                // eslint-disable-next-line react-x/no-array-index-key
                key={ai}
                action={action}
                availableData={availableData}
                onChange={(updated) => {
                  updateAction(gi, ai, updated);
                }}
                onRemove={() => {
                  removeAction(gi, ai);
                }}
              />
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                addAction(gi);
              }}
              className="h-6 text-xs text-zinc-500 hover:text-zinc-300"
            >
              + Add action
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
