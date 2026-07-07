/* eslint-disable react-refresh/only-export-components */
import { useMemo, useState } from 'react';
import { Button } from '@sim/engine/components/ui/button';
import { Input } from '@sim/engine/components/ui/input';
import { TemplateEditor } from '@sim/engine/editor/components/template-editor';
import { useRegisterSave } from '@sim/engine/editor/lib/save-context';
import { useReportDirty } from '@sim/engine/editor/lib/unsaved-changes';
import { useEditorData } from '@sim/engine/editor/lib/use-editor-data';
import { getAppearanceLists } from '@sim/engine/features/npcs/lib/appearance-config';

import type { TemplateLintContext } from './lib/lint';
import { NARRATIVE_VAR_NAMES, PRONOUN_FIELDS } from './lib/variables';
import type {
  LinguisticsJsonData,
  LinguisticsMacro,
  LinguisticsMacroParam,
  LinguisticsTerm,
} from './types';

function SectionTitle({ children }: React.PropsWithChildren) {
  return (
    <h3 className="text-sm font-semibold text-zinc-200 border-b border-zinc-700 pb-1 mb-3">
      {children}
    </h3>
  );
}

function Legend() {
  return (
    <div className="rounded border border-zinc-700 bg-zinc-900/50 p-3 text-[11px] leading-relaxed text-zinc-400 flex flex-col gap-1">
      <span className="text-zinc-300 font-semibold">Template language</span>
      <span>
        Tokens: <code className="text-zinc-300">{'{c.age}'}</code> ·{' '}
        <code className="text-zinc-300">{'{noun}/{subject}/…'}</code> ·{' '}
        <code className="text-zinc-300">{'{var}'}</code> ·{' '}
        <code className="text-zinc-300">{'{lower:var}'}</code> ·{' '}
        <code className="text-zinc-300">{'{a:var}'}</code> ·{' '}
        <code className="text-zinc-300">{'{word:termKey}'}</code> ·{' '}
        <code className="text-zinc-300">{'{@macroName}'}</code>
      </span>
      <span>
        Conditionals:{' '}
        <code className="text-zinc-300">
          {'{if VAR OP VALUE}…{elif …}…{else}…{/if}'}
        </code>{' '}
        — OP is <code className="text-zinc-300">{'>= <= > < == !='}</code>.
      </span>
      <span>
        Macros work on their Character parameter — reference its fields as{' '}
        <code className="text-zinc-300">{'{c.age}'}</code>,{' '}
        <code className="text-zinc-300">{'{c.height}'}</code>,{' '}
        <code className="text-zinc-300">{'{c.subject}'}</code>,{' '}
        <code className="text-zinc-300">{'{c.jawShape}'}</code> and other
        appearance feature ids. Globals stay bare:{' '}
        <code className="text-zinc-300">
          timeOfDay, hour, weather, weatherLabel, season, temperature,
          totalNearbyNpcs
        </code>
        .
      </span>
    </div>
  );
}

function ParamsEditor({
  params,
  onChange,
}: {
  params: LinguisticsMacroParam[];
  onChange: (p: LinguisticsMacroParam[]) => void;
}) {
  const update = (i: number, patch: Partial<LinguisticsMacroParam>) => {
    onChange(params.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  };
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
        params
      </span>
      {params.map((param, i) => (
        // eslint-disable-next-line react-x/no-array-index-key -- editable list with no stable id
        <div key={i} className="flex items-center gap-0.5">
          <Input
            value={param.name}
            placeholder="name"
            onChange={(e) => {
              update(i, { name: e.target.value });
            }}
            className="h-6 w-16 text-[11px] font-mono bg-zinc-800 border-zinc-600 px-1"
          />
          <select
            value={param.type}
            onChange={(e) => {
              update(i, {
                type: e.target.value as LinguisticsMacroParam['type'],
              });
            }}
            className="h-6 text-[11px] bg-zinc-800 border border-zinc-600 rounded text-zinc-300 px-1"
          >
            <option value="Character">Character</option>
          </select>
          <button
            onClick={() => {
              onChange(params.filter((_, j) => j !== i));
            }}
            className="text-zinc-500 hover:text-red-400 text-[11px] px-1"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={() => {
          onChange([...params, { name: '', type: 'Character' }]);
        }}
        className="text-[11px] text-zinc-400 hover:text-zinc-200 px-1"
      >
        + param
      </button>
    </div>
  );
}

function MacroEditor({
  macros,
  onChange,
  baseContext,
}: {
  macros: LinguisticsMacro[];
  onChange: (m: LinguisticsMacro[]) => void;
  baseContext: TemplateLintContext;
}) {
  const update = (i: number, patch: Partial<LinguisticsMacro>) => {
    onChange(
      macros.map((m, j) => {
        if (j !== i) return m;
        const next = { ...m, ...patch };
        // Keep saved JSON byte-identical for parameterless macros.
        if (next.params?.length === 0) delete next.params;
        return next;
      }),
    );
  };
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>Macros</SectionTitle>
      <p className="text-xs text-zinc-500">
        Reusable named snippets. Reference one as{' '}
        <code className="text-zinc-300">{'{@name}'}</code> in any template, or{' '}
        <code className="text-zinc-300">{'{@name arg}'}</code> if it declares
        parameters. Inside a parametered body, write{' '}
        <code className="text-zinc-300">{'{c.bodyFat}'}</code> to reference the
        passed Character.
      </p>
      {macros.map((macro, i) => {
        const params = macro.params ?? [];
        const macroContext: TemplateLintContext = {
          ...baseContext,
          localParams: params,
        };
        return (
          // eslint-disable-next-line react-x/no-array-index-key -- editable list with no stable id
          <div key={i} className="flex items-start gap-2">
            <div className="flex-1 flex flex-col gap-1">
              <Input
                value={macro.name}
                placeholder="name"
                onChange={(e) => {
                  update(i, { name: e.target.value });
                }}
                className="h-7 text-xs font-mono bg-zinc-800 border-zinc-600"
              />
              <ParamsEditor
                params={params}
                onChange={(p) => {
                  update(i, { params: p });
                }}
              />
              <TemplateEditor
                value={macro.template}
                onChange={(v) => {
                  update(i, { template: v });
                }}
                context={macroContext}
              />
            </div>
            <button
              onClick={() => {
                onChange(macros.filter((_, j) => j !== i));
              }}
              className="text-zinc-500 hover:text-red-400 text-xs mt-1"
            >
              ✕
            </button>
          </div>
        );
      })}
      <Button
        size="sm"
        variant="outline"
        className="self-start text-xs"
        onClick={() => {
          onChange([...macros, { name: '', template: '' }]);
        }}
      >
        + Add macro
      </Button>
    </div>
  );
}

function TermEditor({
  terms,
  onChange,
}: {
  terms: LinguisticsTerm[];
  onChange: (t: LinguisticsTerm[]) => void;
}) {
  const update = (i: number, patch: Partial<LinguisticsTerm>) => {
    onChange(terms.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  };
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>Terms</SectionTitle>
      <p className="text-xs text-zinc-500">
        Vocabulary the player can re-skin. Use as{' '}
        <code className="text-zinc-300">{'{word:key}'}</code>; the first option
        is the default. Options are comma-separated.
      </p>
      {terms.map((term, i) => (
        // eslint-disable-next-line react-x/no-array-index-key -- editable list with no stable id
        <div key={i} className="flex items-start gap-2">
          <div className="grid grid-cols-3 gap-1 flex-1">
            <Input
              value={term.key}
              placeholder="key"
              onChange={(e) => {
                update(i, { key: e.target.value });
              }}
              className="h-7 text-xs font-mono bg-zinc-800 border-zinc-600"
            />
            <Input
              value={term.label}
              placeholder="label"
              onChange={(e) => {
                update(i, { label: e.target.value });
              }}
              className="h-7 text-xs bg-zinc-800 border-zinc-600"
            />
            <Input
              value={term.options.join(', ')}
              placeholder="word, word, …"
              onChange={(e) => {
                update(i, {
                  options: e.target.value
                    .split(',')
                    .map((w) => w.trim())
                    .filter(Boolean),
                });
              }}
              className="h-7 text-xs bg-zinc-800 border-zinc-600"
            />
          </div>
          <button
            onClick={() => {
              onChange(terms.filter((_, j) => j !== i));
            }}
            className="text-zinc-500 hover:text-red-400 text-xs"
          >
            ✕
          </button>
        </div>
      ))}
      <Button
        size="sm"
        variant="outline"
        className="self-start text-xs"
        onClick={() => {
          onChange([...terms, { key: '', label: '', options: [] }]);
        }}
      >
        + Add term
      </Button>
    </div>
  );
}

function LinguisticsPanel() {
  const {
    data: initial,
    saving,
    save,
  } = useEditorData<LinguisticsJsonData>('/editor/api/data/linguistics');

  const [data, setData] = useState<LinguisticsJsonData>(initial);

  const context: TemplateLintContext = useMemo(() => {
    const appearanceFeatures = getAppearanceLists().map((f) => f.id);
    return {
      // Macros operate on their Character param, so player-resolving references
      // aren't offered bare — use the param instead (`{c.subject}`,
      // `{c.jawShape}`). Only genuine globals stay bare; `subject`/`possessive`/
      // `reflexive` are dropped as the most footgun-prone bare pronouns.
      variables: [
        ...PRONOUN_FIELDS.filter(
          (f) => !['subject', 'possessive', 'reflexive'].includes(f),
        ),
        ...NARRATIVE_VAR_NAMES,
      ],
      appearanceFeatures,
      macros: data.macros
        .filter((m) => m.name)
        .map((m) => ({ name: m.name, params: m.params ?? [] })),
      terms: data.terms.map((t) => t.key).filter(Boolean),
    };
  }, [data]);

  const dirty = JSON.stringify(data) !== JSON.stringify(initial);
  useReportDirty({
    dirty,
    discard: () => {
      setData(initial);
    },
  });
  useRegisterSave({ save: () => void save(data, 'Linguistics saved'), saving });

  return (
    <div className="p-6 max-w-3xl space-y-8 overflow-y-auto h-full">
      <Legend />
      <MacroEditor
        macros={data.macros}
        baseContext={context}
        onChange={(macros) => {
          setData((prev) => ({ ...prev, macros }));
        }}
      />
      <TermEditor
        terms={data.terms}
        onChange={(terms) => {
          setData((prev) => ({ ...prev, terms }));
        }}
      />
    </div>
  );
}

export default {
  panels: {
    linguistics: {
      label: 'Linguistics',
      group: 'Language',
      file: 'linguistics',
      component: LinguisticsPanel,
    },
  },
};
