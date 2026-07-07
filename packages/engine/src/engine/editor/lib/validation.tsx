/* eslint-disable react-refresh/only-export-components */
import {
  type ReactNode,
  Suspense,
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import {
  idSources,
  nodeRefExtractors,
  nodeRefRewriters,
  referenceProviders,
  referenceRewriters,
} from 'virtual:references';
import {
  type DataByFile,
  type ReferenceContributions,
  type ValidationIssue,
  collectReferences,
  requiredFiles,
  reverseReferences,
  validateReferences,
} from '@chemicalluck/engine/lib/validation';

import {
  preloadEditorData,
  readEditorData,
  subscribeEditorData,
} from './use-editor-data';

export const contributions: ReferenceContributions = {
  idSources,
  referenceProviders,
  nodeRefExtractors,
  nodeRefRewriters,
  referenceRewriters,
};

// Files the contributions need are derived from the contributions themselves —
// no hardcoded list. Adding a feature/data file updates this automatically.
const FILES = requiredFiles(contributions);
const urlFor = (file: string) => `/editor/api/data/${file}`;

preloadEditorData(...FILES.map(urlFor));

export type ReferencesTo = (namespace: string, id: string) => string[];

interface ReferencesValue {
  issues: ValidationIssue[];
  referencesTo: ReferencesTo;
}

const EMPTY: ReferencesValue = { issues: [], referencesTo: () => [] };

const ReferencesContext = createContext<ReferencesValue>(EMPTY);

export function useValidationIssues(): ValidationIssue[] {
  return use(ReferencesContext).issues;
}

export function useReferencesTo(): ReferencesTo {
  return use(ReferencesContext).referencesTo;
}

export function ValidationProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<ReferencesValue>(EMPTY);
  return (
    <ReferencesContext value={value}>
      <Suspense fallback={null}>
        <ReferencesRunner onChange={setValue} />
      </Suspense>
      {children}
    </ReferencesContext>
  );
}

interface RunnerProps {
  onChange: (value: ReferencesValue) => void;
}

function ReferencesRunner({ onChange }: RunnerProps) {
  const [version, bump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => subscribeEditorData(bump), [bump]);

  // Recompute only when the cache changes (version bump). readEditorData
  // suspends until every required file has loaded.
  const records = useMemo(() => {
    const dataByFile: DataByFile = Object.fromEntries(
      FILES.map((file) => [file, readEditorData(urlFor(file))]),
    );
    return {
      refs: collectReferences(
        contributions.referenceProviders,
        contributions.nodeRefExtractors,
        dataByFile,
      ),
      issues: validateReferences(dataByFile, contributions),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const referencesTo = useCallback<ReferencesTo>(
    (namespace, id) => reverseReferences(records.refs, namespace, id),
    [records],
  );

  useEffect(() => {
    onChange({ issues: records.issues, referencesTo });
  }, [records, referencesTo, onChange]);

  return null;
}

const PREFIX_TO_PATH: Record<string, string> = {
  loc: '/locations',
  scene: '/scenes',
  shop: '/shops',
  script: '/scripts',
  item: '/items',
  quest: '/quests',
  edges: '/world',
  minimap: '/world',
  player: '/world',
};

/** Editor route a reference source (`prefix:id`) links to. */
export function sourceToPath(source: string): string | null {
  const colon = source.indexOf(':');
  if (colon === -1) return PREFIX_TO_PATH[source] ?? null;
  const section = PREFIX_TO_PATH[source.slice(0, colon)];
  return section ? `${section}/${source.slice(colon + 1)}` : null;
}
