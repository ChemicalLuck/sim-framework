/* eslint-disable react-refresh/only-export-components */
import { useMemo, useState } from 'react';
import { Button } from '@chemicalluck/sim-engine/components/ui/button';
import { Input } from '@chemicalluck/sim-engine/components/ui/input';
import { useRegisterSave } from '@chemicalluck/sim-engine/editor/lib/save-context';
import { useReportDirty } from '@chemicalluck/sim-engine/editor/lib/unsaved-changes';
import { useEditorData } from '@chemicalluck/sim-engine/editor/lib/use-editor-data';
import type { LocationNode } from '@chemicalluck/sim-engine/features/travel/types';

import { SkillsPanel } from './skills-panel';

interface PlayerCfg {
  postCharacterCreationView: string;
  characterCreationSkillPoints: number;
  startLocation: string;
  bodyParts: string[];
  initialItems: string[];
  initialEquipment: Record<string, string>;
}

interface StringListEditorProps {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}

function StringListEditor({
  values,
  onChange,
  placeholder = 'Add...',
}: StringListEditorProps) {
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

function PlayerDefaultsPanel() {
  const {
    data: cfg,
    saving,
    save,
  } = useEditorData<PlayerCfg>('/editor/api/data/player');
  const { data: locationsData } = useEditorData<LocationNode[]>(
    '/editor/api/data/locations',
  );

  const [startLocation, setStartLocation] = useState(cfg.startLocation);
  const [skillPoints, setSkillPoints] = useState(
    cfg.characterCreationSkillPoints,
  );
  const [postView, setPostView] = useState(cfg.postCharacterCreationView);
  const [bodyParts, setBodyParts] = useState(cfg.bodyParts);
  const [initialItems, setInitialItems] = useState(cfg.initialItems);
  const [initialEquipment, setInitialEquipment] = useState(
    cfg.initialEquipment,
  );

  const locationIds = useMemo(
    () => locationsData.map((l) => l.id).sort(),
    [locationsData],
  );

  const dirty = useMemo(
    () =>
      JSON.stringify({
        startLocation,
        skillPoints,
        postView,
        bodyParts,
        initialItems,
        initialEquipment,
      }) !==
      JSON.stringify({
        startLocation: cfg.startLocation,
        skillPoints: cfg.characterCreationSkillPoints,
        postView: cfg.postCharacterCreationView,
        bodyParts: cfg.bodyParts,
        initialItems: cfg.initialItems,
        initialEquipment: cfg.initialEquipment,
      }),
    [
      startLocation,
      skillPoints,
      postView,
      bodyParts,
      initialItems,
      initialEquipment,
      cfg,
    ],
  );

  function discard() {
    setStartLocation(cfg.startLocation);
    setSkillPoints(cfg.characterCreationSkillPoints);
    setPostView(cfg.postCharacterCreationView);
    setBodyParts(cfg.bodyParts);
    setInitialItems(cfg.initialItems);
    setInitialEquipment(cfg.initialEquipment);
  }

  function doSave() {
    void save(
      {
        ...cfg,
        startLocation,
        characterCreationSkillPoints: skillPoints,
        postCharacterCreationView: postView,
        bodyParts,
        initialItems,
        initialEquipment,
      },
      'Player defaults saved',
    );
  }

  useReportDirty({ dirty, discard });
  useRegisterSave({ save: doSave, saving });

  return (
    <div className="p-6 max-w-2xl space-y-8">
      <h2 className="text-sm font-semibold text-white">Player Defaults</h2>

      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          General
        </h3>
        <div className="space-y-2">
          <label className="text-xs text-zinc-400 block">
            Starting Location
          </label>
          <div className="flex items-center gap-2">
            <Input
              value={startLocation}
              onChange={(e) => {
                setStartLocation(e.target.value);
              }}
              list="loc-ids"
              placeholder="bedroom"
              className="h-9 text-sm bg-zinc-800 border-zinc-600 w-64"
            />
            <datalist id="loc-ids">
              {locationIds.map((id) => (
                <option key={id} value={id} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-zinc-400 block">
            Character Creation Skill Points
          </label>
          <Input
            type="number"
            value={skillPoints}
            onChange={(e) => {
              setSkillPoints(Number(e.target.value));
            }}
            min={0}
            max={50}
            className="h-9 text-sm bg-zinc-800 border-zinc-600 w-32"
          />
          <p className="text-xs text-zinc-600">
            Points players may distribute across skills at character creation
            (max 3 per skill).
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-zinc-400 block">
            Post Character Creation View
          </label>
          <Input
            value={postView}
            onChange={(e) => {
              setPostView(e.target.value);
            }}
            placeholder="DefaultView"
            className="h-9 text-sm bg-zinc-800 border-zinc-600 w-64"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Body Parts
        </h3>
        <StringListEditor
          values={bodyParts}
          onChange={setBodyParts}
          placeholder="New body part..."
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Initial Items
        </h3>
        <StringListEditor
          values={initialItems}
          onChange={setInitialItems}
          placeholder="Wearable ID..."
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Initial Equipment
        </h3>
        <div className="space-y-1.5">
          {Object.entries(initialEquipment).map(([slot, id]) => (
            <div key={slot} className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400 w-28 shrink-0">
                {slot}
              </span>
              <Input
                value={id}
                onChange={(e) => {
                  setInitialEquipment((prev) => ({
                    ...prev,
                    [slot]: e.target.value,
                  }));
                }}
                className="h-7 text-sm bg-zinc-800 border-zinc-600 flex-1"
              />
              <button
                onClick={() => {
                  setInitialEquipment((prev) =>
                    Object.fromEntries(
                      Object.entries(prev).filter(([k]) => k !== slot),
                    ),
                  );
                }}
                className="text-zinc-500 hover:text-red-400 text-sm w-5 shrink-0"
                aria-label={`Remove slot ${slot}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default {
  panels: {
    'player-defaults': {
      label: 'Player Defaults',
      group: 'Core',
      component: PlayerDefaultsPanel,
    },
    skills: { label: 'Skills', group: 'Characters', component: SkillsPanel },
  },
};
