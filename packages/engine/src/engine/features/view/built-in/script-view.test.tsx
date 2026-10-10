import { act, fireEvent, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { parseCondition } from '@chemicalluck/sim-engine/lib/conditions';
import { renderWithStore } from '@chemicalluck/sim-engine/test-utils/render';
import type { Effect, Scene, Script } from '@chemicalluck/sim-engine/types';

import { ViewsContext } from '../context';
import ViewManager from '../manager';
import viewReducer, { setView } from '../slice';
import ScriptView from './script-view';

vi.mock('@chemicalluck/sim-engine/components/with-sidebar', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@chemicalluck/sim-engine/components/item-actions-button-list', () => ({
  ItemActionsButtonsList: () => null,
}));
vi.mock(
  '@chemicalluck/sim-engine/features/linguistics/use-template-context',
  () => ({ useTemplateContext: () => ({}) }),
);
// Stand-in for the effect pipeline: the test reducer below applies the few
// effect kinds these tests use and records every effect it receives.
vi.mock('@chemicalluck/sim-engine/state/thunks', () => ({
  processEffects: (effects: Effect[]) => ({
    type: 'test/effects',
    payload: effects,
  }),
}));

interface TestPresent {
  view: ReturnType<typeof viewReducer>;
  money: number;
  time: { timestamp: number };
  npcs: { characters: never[]; named: never[]; nearby: never[] };
  applied: Effect[];
}

function makeReducer() {
  const initial: { present: TestPresent } = {
    present: {
      view: viewReducer(undefined, { type: '@@INIT' }),
      money: 0,
      time: { timestamp: 0 },
      npcs: { characters: [], named: [], nearby: [] },
      applied: [],
    },
  };
  return (
    state = initial,
    action: { type: string; payload?: unknown },
  ): { present: TestPresent } => {
    let present = state.present;
    if (action.type === 'test/effects') {
      for (const effect of action.payload as Effect[]) {
        present = { ...present, applied: [...present.applied, effect] };
        if (effect.kind === 'money') {
          present = { ...present, money: present.money + effect.amount };
        } else if (effect.kind === 'view') {
          present = {
            ...present,
            view: viewReducer(present.view, setView(effect)),
          };
        }
      }
    } else {
      present = {
        ...present,
        view: viewReducer(present.view, action),
      };
    }
    return present === state.present ? state : { present };
  };
}

const money = (amount: number): Effect => ({ kind: 'money', amount });

function beat(text: string, actionEffects: Effect[] = []): Scene {
  return {
    kind: 'scene',
    text,
    actions: [
      {
        actions: [
          { kind: 'action', text: `${text} go`, effects: actionEffects },
        ],
      },
    ],
  };
}

function script(overrides: Partial<Script> = {}): Script {
  return {
    order: 'sequential',
    duration: 30,
    scenes: [beat('One', [money(1)]), beat('Two', [money(1)]), beat('Three')],
    ...overrides,
  } as Script;
}

/** Render ScriptView as the active view, the way the game shows it. */
function renderScript(s: Script) {
  const result = renderWithStore(
    <ViewsContext value={{ ScriptView }}>
      <ViewManager />
    </ViewsContext>,
    { reducer: makeReducer() },
  );
  act(() => {
    result.store.dispatch(
      setView({ activeViewId: 'ScriptView', props: { script: s } }),
    );
  });
  const present = () =>
    (result.store.getState() as { present: TestPresent }).present;
  return { ...result, present };
}

describe('ScriptView', () => {
  it('ends the script after the current beat once endCondition holds', () => {
    const s = script({
      endCondition: parseCondition('money >= 2'),
      completionEffects: [money(100)],
    });
    const { present } = renderScript(s);

    fireEvent.click(screen.getByText('One go'));
    expect(screen.getByText('Two')).toBeInTheDocument();
    expect(present().money).toBe(1);

    fireEvent.click(screen.getByText('Two go'));
    expect(screen.queryByText('Three')).not.toBeInTheDocument();
    expect(present().money).toBe(102);
  });

  it("runs the leave effects, scaled like Leave, when endWith is 'leave'", () => {
    const s = script({
      endCondition: parseCondition('money >= 1'),
      endWith: 'leave',
      completionEffects: [money(30)],
      leave: { effects: [money(-0.5)], scaleCompletionEffects: true },
    });
    const { present } = renderScript(s);

    fireEvent.click(screen.getByText('One go'));
    // 1 from the beat, -0.5 leave, 30 × 1/3 scaled completion.
    expect(present().money).toBe(10.5);
    expect(present().view.activeViewId).toBe('DefaultView');
    expect(screen.queryByText('Two')).not.toBeInTheDocument();
  });

  it('keeps going while endCondition is false', () => {
    const s = script({ endCondition: parseCondition('money >= 50') });
    renderScript(s);
    fireEvent.click(screen.getByText('One go'));
    fireEvent.click(screen.getByText('Two go'));
    expect(screen.getByText('Three')).toBeInTheDocument();
  });

  it('advances time by increment on each beat', () => {
    const { present } = renderScript(script({ increment: 7 }));
    fireEvent.click(screen.getByText('One go'));
    expect(present().applied).toContainEqual({ kind: 'time', minutes: 7 });
  });

  it("runs each scene's completionEffects after its beat", () => {
    const s = script({
      scenes: [{ ...beat('One'), completionEffects: [money(5)] }, beat('Two')],
    });
    const { present } = renderScript(s);
    fireEvent.click(screen.getByText('One go'));
    expect(present().money).toBe(5);
    fireEvent.click(screen.getByText('Two go'));
    expect(present().money).toBe(5);
  });

  it('starts a newly shown script at step 0 (ScriptView → ScriptView)', () => {
    const first = script();
    const second = script({ scenes: [beat('Alpha'), beat('Beta')] });
    const { store } = renderScript(first);

    fireEvent.click(screen.getByText('One go'));
    expect(screen.getByText('Two')).toBeInTheDocument();

    act(() => {
      store.dispatch(
        setView({ activeViewId: 'ScriptView', props: { script: second } }),
      );
    });
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });
});
