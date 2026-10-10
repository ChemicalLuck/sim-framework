import { Checkbox } from '@chemicalluck/sim-engine/components/ui/checkbox';
import { Field } from '@chemicalluck/sim-engine/components/ui/field';
import { Input } from '@chemicalluck/sim-engine/components/ui/input';
import { Label } from '@chemicalluck/sim-engine/components/ui/label';
import { defineEffectEditor } from '@chemicalluck/sim-engine/editor/lib/effect-editor';

interface AutosaveFormState {
  label: string;
  keep: boolean;
}

const autosave = defineEffectEditor<AutosaveFormState>({
  kind: 'autosave',
  color: 'bg-slate-800/60 text-slate-300',
  label: (e) => {
    if (e.kind !== 'autosave') return 'fx';
    const name = e.label ? `autosave:${e.label}` : 'autosave';
    return e.keep ? `${name} (keep)` : name;
  },
  defaultState: { label: '', keep: false },
  toFormState: (e) => ({
    label: e.kind === 'autosave' ? (e.label ?? '') : '',
    keep: e.kind === 'autosave' && e.keep === true,
  }),
  buildEffect: (s) => ({
    kind: 'autosave',
    ...(s.label.trim() && { label: s.label.trim() }),
    ...(s.keep && { keep: true }),
  }),
  Fields: ({ value, onChange }) => (
    <>
      <Field>
        <Label>Label</Label>
        <Input
          value={value.label}
          onChange={(e) => {
            onChange({ label: e.target.value });
          }}
          placeholder="Woke up"
        />
      </Field>
      <Field>
        <div className="flex items-center gap-2">
          <Checkbox
            id="autosaveKeep"
            checked={value.keep}
            onCheckedChange={(v) => {
              onChange({ keep: v === true });
            }}
          />
          <Label htmlFor="autosaveKeep">
            Keep as a permanent checkpoint (never rotated out)
          </Label>
        </div>
      </Field>
    </>
  ),
});

declare module '@chemicalluck/sim-engine/editor/lib/effect-editor' {
  interface EffectEditorMap {
    autosave: typeof autosave;
  }
}

export default { autosave };
