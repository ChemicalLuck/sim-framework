import { useState } from 'react';
import { Button } from '@chemicalluck/sim-engine/components/ui/button';
import { Input } from '@chemicalluck/sim-engine/components/ui/input';
import { useRegisterSave } from '@chemicalluck/sim-engine/editor/lib/save-context';
import { useReportDirty } from '@chemicalluck/sim-engine/editor/lib/unsaved-changes';
import { useEditorData } from '@chemicalluck/sim-engine/editor/lib/use-editor-data';
import type { SkillDefinition } from '@chemicalluck/sim-engine/features/player/lib/skills';

function SkillRow({
  skill,
  onChange,
  onRemove,
}: {
  skill: SkillDefinition;
  onChange: (updated: SkillDefinition) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_2fr_3fr_5rem_5rem_2rem] gap-2 items-center">
      <Input
        value={skill.id}
        onChange={(e) => {
          onChange({ ...skill, id: e.target.value });
        }}
        placeholder="id"
        className="h-7 text-xs bg-zinc-800 border-zinc-600 font-mono"
      />
      <Input
        value={skill.name}
        onChange={(e) => {
          onChange({ ...skill, name: e.target.value });
        }}
        placeholder="Name"
        className="h-7 text-xs bg-zinc-800 border-zinc-600"
      />
      <Input
        value={skill.description ?? ''}
        onChange={(e) => {
          onChange({ ...skill, description: e.target.value || undefined });
        }}
        placeholder="Description (optional)"
        className="h-7 text-xs bg-zinc-800 border-zinc-600"
      />
      <Input
        type="number"
        value={skill.npcRange?.[0] ?? 0}
        onChange={(e) => {
          onChange({
            ...skill,
            npcRange: [Number(e.target.value), skill.npcRange?.[1] ?? 5],
          });
        }}
        placeholder="Min"
        className="h-7 text-xs bg-zinc-800 border-zinc-600"
        min={0}
        max={10}
      />
      <Input
        type="number"
        value={skill.npcRange?.[1] ?? 5}
        onChange={(e) => {
          onChange({
            ...skill,
            npcRange: [skill.npcRange?.[0] ?? 0, Number(e.target.value)],
          });
        }}
        placeholder="Max"
        className="h-7 text-xs bg-zinc-800 border-zinc-600"
        min={0}
        max={10}
      />
      <button
        onClick={onRemove}
        className="text-zinc-500 hover:text-red-400 text-lg leading-none text-center"
        aria-label="Remove skill"
      >
        ×
      </button>
    </div>
  );
}

export function SkillsPanel() {
  const {
    data: initial,
    saving,
    save,
  } = useEditorData<SkillDefinition[]>('/editor/api/data/skills');
  const [skills, setSkills] = useState<SkillDefinition[]>(initial);
  const dirty = JSON.stringify(skills) !== JSON.stringify(initial);
  useReportDirty({
    dirty,
    discard: () => {
      setSkills(initial);
    },
  });
  useRegisterSave({ save: () => void save(skills, 'Skills saved'), saving });

  function updateSkill(index: number, updated: SkillDefinition) {
    setSkills((prev) => prev.map((s, i) => (i === index ? updated : s)));
  }

  function removeSkill(index: number) {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  }

  function addSkill() {
    setSkills((prev) => [
      ...prev,
      { id: '', name: '', description: undefined, npcRange: [0, 5] },
    ]);
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-white">Skills</h2>
        <p className="text-xs text-zinc-500">
          Edits <code>src/game/data/skills.json</code>. NPC Range sets the
          random level assigned to generated NPCs (inclusive, 0–10).
        </p>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_2fr_3fr_5rem_5rem_2rem] gap-2 text-xs text-zinc-500 font-medium uppercase tracking-wider px-0">
          <span>ID</span>
          <span>Name</span>
          <span>Description</span>
          <span>NPC Min</span>
          <span>NPC Max</span>
          <span />
        </div>

        {skills.map((skill, i) => (
          <SkillRow
            // eslint-disable-next-line
            key={i}
            skill={skill}
            onChange={(updated) => {
              updateSkill(i, updated);
            }}
            onRemove={() => {
              removeSkill(i);
            }}
          />
        ))}

        {skills.length === 0 && (
          <p className="text-xs text-zinc-600 py-4 text-center">
            No skills defined. Add one below.
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button size="sm" variant="outline" onClick={addSkill} className="h-7">
          + Add Skill
        </Button>
      </div>
    </div>
  );
}
