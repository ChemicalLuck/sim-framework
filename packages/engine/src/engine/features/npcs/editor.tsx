/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import { Button } from '@sim/engine/components/ui/button';
import { Input } from '@sim/engine/components/ui/input';
import { useRegisterSave } from '@sim/engine/editor/lib/save-context';
import { useReportDirty } from '@sim/engine/editor/lib/unsaved-changes';
import { useEditorData } from '@sim/engine/editor/lib/use-editor-data';

import { AppearancePanel } from './appearance-panel';
import { ConversationsPanel } from './conversations-panel';
import { NamedNpcsPanel } from './named-npcs-panel';

interface ProfessionsCfg {
  professions: string[];
}

function StringListEditor({
  values,
  onChange,
  placeholder = 'Add...',
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [newVal, setNewVal] = useState('');

  function add() {
    const trimmed = newVal.trim();
    if (!trimmed || values.includes(trimmed)) return;
    onChange([...values, trimmed]);
    setNewVal('');
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <div
            key={v}
            className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs font-mono text-zinc-200"
          >
            {v}
            <button
              onClick={() => {
                onChange(values.filter((x) => x !== v));
              }}
              className="text-zinc-500 hover:text-red-400 ml-1 leading-none"
              aria-label={`Remove ${v}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newVal}
          onChange={(e) => {
            setNewVal(e.target.value);
          }}
          placeholder={placeholder}
          className="h-7 text-sm bg-zinc-800 border-zinc-600 flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') add();
          }}
        />
        <Button
          size="sm"
          onClick={add}
          disabled={!newVal.trim()}
          className="h-7 shrink-0"
        >
          Add
        </Button>
      </div>
    </div>
  );
}

function ProfessionsPanel() {
  const {
    data: cfg,
    saving,
    save,
  } = useEditorData<ProfessionsCfg>('/editor/api/data/professions');

  const [professions, setProfessions] = useState(cfg.professions);

  const dirty = JSON.stringify(professions) !== JSON.stringify(cfg.professions);

  function discard() {
    setProfessions(cfg.professions);
  }

  function doSave() {
    void save({ ...cfg, professions }, 'Professions saved');
  }

  useReportDirty({ dirty, discard });
  useRegisterSave({ save: doSave, saving });

  return (
    <div className="p-6 max-w-2xl space-y-8">
      <h2 className="text-sm font-semibold text-white">Professions</h2>
      <div className="space-y-3">
        <p className="text-xs text-zinc-500">
          Available profession values for NPCs and player characters.
        </p>
        <StringListEditor
          values={professions}
          onChange={setProfessions}
          placeholder="New profession..."
        />
      </div>
    </div>
  );
}

export default {
  panels: {
    'npcs-professions': {
      label: 'Professions',
      group: 'NPCs',
      component: ProfessionsPanel,
    },
    'named-npcs': {
      label: 'Named NPCs',
      group: 'Characters',
      file: 'named-npcs',
      component: NamedNpcsPanel,
    },
    conversations: {
      label: 'Conversations',
      group: 'Narrative',
      file: 'conversations',
      component: ConversationsPanel,
    },
    appearance: {
      label: 'Appearance',
      group: 'Characters',
      component: AppearancePanel,
    },
  },
};
