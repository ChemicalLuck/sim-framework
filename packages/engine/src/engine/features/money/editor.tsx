/* eslint-disable react-refresh/only-export-components */
import { useMemo, useState } from 'react';
import { Input } from '@sim/engine/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sim/engine/components/ui/select';
import { useRegisterSave } from '@sim/engine/editor/lib/save-context';
import { useReportDirty } from '@sim/engine/editor/lib/unsaved-changes';
import { useEditorData } from '@sim/engine/editor/lib/use-editor-data';

interface CurrencyCfg {
  locale: string;
  code: string;
}

const CURRENCY_PRESETS: { code: string; locale: string; label: string }[] = [
  { code: 'GBP', locale: 'en-GB', label: 'British Pound (£)' },
  { code: 'USD', locale: 'en-US', label: 'US Dollar ($)' },
  { code: 'EUR', locale: 'de-DE', label: 'Euro (€)' },
  { code: 'JPY', locale: 'ja-JP', label: 'Japanese Yen (¥)' },
  { code: 'CAD', locale: 'en-CA', label: 'Canadian Dollar (CA$)' },
  { code: 'AUD', locale: 'en-AU', label: 'Australian Dollar (A$)' },
  { code: 'CHF', locale: 'de-CH', label: 'Swiss Franc (CHF)' },
  { code: 'SEK', locale: 'sv-SE', label: 'Swedish Krona (kr)' },
  { code: 'NOK', locale: 'nb-NO', label: 'Norwegian Krone (kr)' },
  { code: 'DKK', locale: 'da-DK', label: 'Danish Krone (kr)' },
];

function formatCurrencyPreview(locale: string, code: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
    }).format(1234.56);
  } catch {
    return 'invalid';
  }
}

function MoneyPanel() {
  const {
    data: currencyData,
    saving: savingCurrency,
    save: saveCurrency,
  } = useEditorData<CurrencyCfg>('/editor/api/data/currency');
  const {
    data: initialMoneyData,
    saving: savingMoney,
    save: saveMoney,
  } = useEditorData<number>('/editor/api/data/initial-money');

  const [currency, setCurrency] = useState<CurrencyCfg>(currencyData);
  const [initialMoney, setInitialMoney] = useState(initialMoneyData);

  const saving = savingCurrency || savingMoney;

  const dirty = useMemo(
    () =>
      JSON.stringify(currency) !== JSON.stringify(currencyData) ||
      initialMoney !== initialMoneyData,
    [currency, currencyData, initialMoney, initialMoneyData],
  );

  function discard() {
    setCurrency(currencyData);
    setInitialMoney(initialMoneyData);
  }

  function doSave() {
    void saveCurrency(currency, 'Currency saved');
    void saveMoney(initialMoney);
  }

  useReportDirty({ dirty, discard });
  useRegisterSave({ save: doSave, saving });

  return (
    <div className="p-6 max-w-2xl space-y-8">
      <h2 className="text-sm font-semibold text-white">Currency &amp; Money</h2>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Currency
        </h3>
        <div className="space-y-2">
          <label className="text-xs text-zinc-400 block">Currency</label>
          <Select
            value={currency.code}
            onValueChange={(code) => {
              const preset = CURRENCY_PRESETS.find((p) => p.code === code);
              if (preset)
                setCurrency({ code: preset.code, locale: preset.locale });
              else setCurrency((prev) => ({ ...prev, code }));
            }}
          >
            <SelectTrigger size="sm" className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_PRESETS.map((p) => (
                <SelectItem key={p.code} value={p.code}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-zinc-400 block">Locale</label>
          <Input
            value={currency.locale}
            onChange={(e) => {
              setCurrency((prev) => ({ ...prev, locale: e.target.value }));
            }}
            placeholder="en-GB"
            className="h-9 text-sm bg-zinc-800 border-zinc-600 w-64"
          />
          <p className="text-xs text-zinc-600">
            BCP 47 locale tag — controls number formatting (e.g.{' '}
            <code className="text-zinc-500">en-GB</code>,{' '}
            <code className="text-zinc-500">de-DE</code>)
          </p>
        </div>
        <p className="text-xs text-zinc-500">
          Preview:{' '}
          <code className="text-zinc-300">
            {formatCurrencyPreview(currency.locale, currency.code)}
          </code>
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Starting Money
        </h3>
        <div className="space-y-2">
          <label className="text-xs text-zinc-400 block">Initial Amount</label>
          <Input
            type="number"
            value={initialMoney}
            onChange={(e) => {
              setInitialMoney(Number(e.target.value));
            }}
            min={0}
            className="h-9 text-sm bg-zinc-800 border-zinc-600 w-48"
          />
        </div>
      </div>
    </div>
  );
}

export default {
  panels: {
    money: { label: 'Currency & Money', group: 'Core', component: MoneyPanel },
  },
};
