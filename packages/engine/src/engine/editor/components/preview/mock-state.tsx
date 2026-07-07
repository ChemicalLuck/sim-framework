/* eslint-disable react-refresh/only-export-components */
import {
  type ReactNode,
  createContext,
  use,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { RootState } from '@chemicalluck/sim-engine/state/store';

/**
 * Editable stand-in for the slices the condition DSL reads, used to evaluate
 * action/objective gating inside the editor preview. No real store is built —
 * {@link buildMockRootState} hand-assembles just enough `present` state for
 * `isConditionMet`.
 */
export interface PreviewState {
  /** ISO date (drives season + `time.date`/`gametime`). */
  date: string;
  /** Hour of day 0–23 (drives `gamehour`). */
  hour: number;
  money: number;
  location: string;
  /** Weather condition id override, or '' to leave computed. */
  weather: string;
  needs: Record<string, number>;
  skills: Record<string, number>;
  milestones: string[];
}

export const DEFAULT_PREVIEW_STATE: PreviewState = {
  date: '2025-10-01',
  hour: 12,
  money: 100,
  location: '',
  weather: '',
  needs: {},
  skills: {},
  milestones: [],
};

/** Hand-assemble a `RootState` covering every slice the condition DSL reads. */
export function buildMockRootState(state: PreviewState): RootState {
  const date = new Date(`${state.date}T00:00:00`);
  if (!Number.isNaN(date.getTime())) date.setHours(state.hour);
  const timestamp = Number.isNaN(date.getTime()) ? 0 : date.getTime();

  const present = {
    money: state.money,
    time: { timestamp },
    player: {
      locationId: state.location,
      skills: state.skills,
      equipment: {},
    },
    needs: state.needs,
    milestones: { achieved: state.milestones },
    weather: { conditionOverride: state.weather || null },
    encounter: { npcNeeds: {} },
    clothing: {},
    containers: { player: [] },
    relationships: {},
    rng: { seed: 1 },
  };

  return { present } as unknown as RootState;
}

const STORAGE_KEY = 'editor.previewState';

function loadPersisted(): PreviewState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw)
      return { ...DEFAULT_PREVIEW_STATE, ...(JSON.parse(raw) as object) };
  } catch {
    // ignore malformed storage
  }
  return DEFAULT_PREVIEW_STATE;
}

interface PreviewContextValue {
  values: PreviewState;
  setValues: (next: PreviewState) => void;
  mockState: RootState;
}

const PreviewStateContext = createContext<PreviewContextValue | null>(null);

export function PreviewStateProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<PreviewState>(loadPersisted);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    } catch {
      // ignore quota/serialisation errors
    }
  }, [values]);

  const mockState = useMemo(() => buildMockRootState(values), [values]);
  const ctx = useMemo(
    () => ({ values, setValues, mockState }),
    [values, mockState],
  );

  return <PreviewStateContext value={ctx}>{children}</PreviewStateContext>;
}

export function usePreviewState(): PreviewContextValue {
  const ctx = use(PreviewStateContext);
  if (!ctx) {
    throw new Error('usePreviewState used outside <PreviewStateProvider>');
  }
  return ctx;
}
