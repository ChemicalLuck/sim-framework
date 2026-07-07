import { Field } from '@sim/engine/components/ui/field';
import { Label } from '@sim/engine/components/ui/label';
import { editorTemplateContext } from '@sim/engine/editor/components/template-context';
import { TemplateEditor } from '@sim/engine/editor/components/template-editor';
import { defineEffectEditor } from '@sim/engine/editor/lib/effect-editor';

interface DescFormState {
  text: string;
}

const desc = defineEffectEditor<DescFormState>({
  kind: 'desc',
  color: 'bg-zinc-700 text-zinc-300',
  label: () => 'desc',
  defaultState: { text: '' },
  toFormState: (e) => ({ text: e.kind === 'desc' ? e.text : '' }),
  buildEffect: (s) => {
    if (!s.text.trim()) return null;
    return { kind: 'desc', text: s.text.trim() };
  },
  Fields: ({ value, onChange }) => (
    <Field>
      <Label>Text</Label>
      <TemplateEditor
        value={value.text}
        onChange={(text) => {
          onChange({ text });
        }}
        context={editorTemplateContext()}
      />
    </Field>
  ),
});

declare module '@sim/engine/editor/lib/effect-editor' {
  interface EffectEditorMap {
    desc: typeof desc;
  }
}

export default { desc };
