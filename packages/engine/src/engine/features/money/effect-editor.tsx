import { NumField } from '@chemicalluck/sim-engine/editor/components/effect-form-primitives';
import { defineEffectEditor } from '@chemicalluck/sim-engine/editor/lib/effect-editor';
import { formatMoney } from '@chemicalluck/sim-engine/features/money/lib/currency';

interface MoneyFormState {
  amount: string;
}

const money = defineEffectEditor<MoneyFormState>({
  kind: 'money',
  color: 'bg-yellow-900/60 text-yellow-300',
  label: (e) => (e.kind === 'money' ? formatMoney(e.amount) : 'fx'),
  defaultState: { amount: '' },
  toFormState: (e) => ({
    amount: e.kind === 'money' ? String(e.amount) : '',
  }),
  buildEffect: (s) => ({ kind: 'money', amount: Number(s.amount) || 0 }),
  Fields: ({ value, onChange }) => (
    <NumField
      label="Amount (negative = cost)"
      value={value.amount}
      onChange={(v) => {
        onChange({ amount: v });
      }}
      step="0.01"
      placeholder="-1.50"
    />
  ),
});

declare module '@chemicalluck/sim-engine/editor/lib/effect-editor' {
  interface EffectEditorMap {
    money: typeof money;
  }
}

export default { money };
