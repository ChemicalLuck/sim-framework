/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import { Input } from '@sim/engine/components/ui/input';
import { useRegisterSave } from '@sim/engine/editor/lib/save-context';
import { useReportDirty } from '@sim/engine/editor/lib/unsaved-changes';
import { useEditorData } from '@sim/engine/editor/lib/use-editor-data';

function TimeConfigPanel() {
  const {
    data: iso,
    saving,
    save,
  } = useEditorData<string>('/editor/api/data/time');
  const [value, setValue] = useState(iso);
  const dirty = value !== iso;

  useReportDirty({
    dirty,
    discard: () => {
      setValue(iso);
    },
  });
  useRegisterSave({
    save: () => {
      void save(value, 'Game start saved');
    },
    saving,
  });

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h2 className="text-sm font-semibold text-white">Game Time</h2>
      <div className="space-y-2">
        <label className="text-xs text-zinc-400 block">
          Game Start Date &amp; Time
        </label>
        <Input
          type="datetime-local"
          value={value.slice(0, 16)}
          onChange={(e) => {
            setValue(e.target.value + ':00');
          }}
          className="h-9 text-sm bg-zinc-800 border-zinc-600 w-64"
        />
        <p className="text-xs text-zinc-600">
          Current value: <code className="text-zinc-400">{value}</code>
        </p>
      </div>
    </div>
  );
}

export default {
  panels: {
    'game-time': {
      label: 'Game Time',
      group: 'Core',
      component: TimeConfigPanel,
    },
  },
};
