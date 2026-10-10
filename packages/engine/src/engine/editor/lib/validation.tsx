/* eslint-disable react-refresh/only-export-components */
import {
  type ReactNode,
  Suspense,
  createContext,
  use,
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
  requiredDataFiles,
} from 'virtual:references';

import {
  type DataByFile,
  type ReferenceContributions,
  type ValidationIssue,
  collectReferences,
  missingRequiredFiles,
  requiredFiles,
  reverseReferences,
  validateReferences,
} from '@chemicalluck/sim-engine/lib/validation';

import {
  preloadEditorData,
  readOptionalEditorData,
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
  /** Required data files (see `requiredDataFiles`) the game doesn't have. */
  missingFiles: string[];
  referencesTo: ReferencesTo;
}

const EMPTY: ReferencesValue = {
  issues: [],
  missingFiles: [],
  referencesTo: () => [],
};

const ReferencesContext = createContext<ReferencesValue>(EMPTY);

export function useValidationIssues(): ValidationIssue[] {
  return use(ReferencesContext).issues;
}

/**
 * Required data files that are absent. Their panels open empty (saving creates
 * the file), so this is where the absence surfaces; an absent optional file
 * (e.g. weather.json) is not listed.
 */
export function useMissingRequiredFiles(): string[] {
  return use(ReferencesContext).missingFiles;
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

  // Recompute only when the cache changes (version bump). The read suspends
  // until every file has loaded — so this must run during render, not inside
  // the effect below. A file the game doesn't have (e.g. an optional
  // weather.json) reads as undefined and is skipped, like a namespace with no
  // source file; real read or parse errors still throw.
  // eslint-disable-next-line react-x/no-unnecessary-use-memo
  const records = useMemo(() => {
    const dataByFile: DataByFile = {};
    for (const file of FILES) {
      const data = readOptionalEditorData(urlFor(file));
      if (data !== undefined) dataByFile[file] = data;
    }
    return {
      refs: collectReferences(
        contributions.referenceProviders,
        contributions.nodeRefExtractors,
        dataByFile,
      ),
      issues: validateReferences(dataByFile, contributions),
      missingFiles: missingRequiredFiles(
        contributions,
        dataByFile,
        requiredDataFiles,
      ),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  useEffect(() => {
    const referencesTo: ReferencesTo = (namespace, id) =>
      reverseReferences(records.refs, namespace, id);
    onChange({
      issues: records.issues,
      missingFiles: records.missingFiles,
      referencesTo,
    });
  }, [records, onChange]);

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
  'wearables-config': '/wearables-config',
};

/** Editor route a reference source (`prefix:id`) links to. */
export function sourceToPath(source: string): string | null {
  const colon = source.indexOf(':');
  if (colon === -1) return PREFIX_TO_PATH[source] ?? null;
  const section = PREFIX_TO_PATH[source.slice(0, colon)];
  return section ? `${section}/${source.slice(colon + 1)}` : null;
}
