import { fireEvent } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import type { Mock } from 'vitest';
import { describe, expect, it, vi } from 'vitest';

import { PanelFileProvider } from '@chemicalluck/sim-engine/editor/lib/panel-file';
import { useSaveContext } from '@chemicalluck/sim-engine/editor/lib/save-context';
import { useEditorData } from '@chemicalluck/sim-engine/editor/lib/use-editor-data';
import {
  mockEditorDataHandle,
  renderEditorPanel,
} from '@chemicalluck/sim-engine/test-utils/render';

import type { JsonQuest } from './authoring.types';
import editor from './editor';

vi.mock('@chemicalluck/sim-engine/editor/lib/use-editor-data', () => ({
  useEditorData: vi.fn(),
  preloadEditorData: vi.fn(),
}));

// The real modules pull in every editor panel and a whole loaded game.
vi.mock('@chemicalluck/sim-engine/editor/lib/use-available-data', () => ({
  useAvailableData: () => ({}),
}));
vi.mock(
  '@chemicalluck/sim-engine/editor/components/preview/preview-pane',
  () => ({
    PreviewPane: () => null,
  }),
);

// CodeMirror doesn't run under jsdom; a plain input stands in for the text.
vi.mock('@chemicalluck/sim-engine/editor/components/template-editor', () => ({
  TemplateEditor: ({ value }: { value: string }) => (
    <input aria-label="Action text" value={value} readOnly />
  ),
}));

const QuestsPanel = editor.panels.quests.component;

const quests: JsonQuest[] = [
  {
    id: 'job',
    name: 'Find a job',
    objectives: [
      {
        name: 'ask',
        state: 'locked',
        trigger: {
          kind: 'action',
          text: 'Ask about work',
          condition: { kind: 'milestone', milestoneId: 'met' },
          effects: [{ kind: 'money', amount: 5 }],
        },
        condition: { kind: 'milestone', milestoneId: 'hired' },
      },
    ],
  },
];

function SaveButton() {
  const { saveAll } = useSaveContext();
  return <button onClick={saveAll}>save all</button>;
}

function renderQuests() {
  const handle = mockEditorDataHandle(structuredClone(quests));
  (useEditorData as Mock).mockImplementation((url: string) =>
    url === '/editor/api/data/quests' ? handle : mockEditorDataHandle([]),
  );
  const result = renderEditorPanel(
    <PanelFileProvider file="quests">
      <Routes>
        <Route
          path="/quests/:entryId?"
          element={
            <>
              <QuestsPanel />
              <SaveButton />
            </>
          }
        />
      </Routes>
    </PanelFileProvider>,
    { initialEntries: ['/quests/job'] },
  );
  return { ...result, handle };
}

describe('quests editor panel', () => {
  it('shows an action trigger as an action rather than a condition', () => {
    const { getByText, getByLabelText, queryByTitle } = renderQuests();

    expect(getByText('trigger: action')).toBeInTheDocument();
    expect(getByLabelText('Action text')).toHaveValue('Ask about work');
    expect(getByText('if: milestone.met')).toBeInTheDocument();
    expect(queryByTitle('Edit trigger')).toBeNull();
  });

  it('preserves an action trigger on save', () => {
    const { getByText, handle } = renderQuests();
    fireEvent.click(getByText('save all'));
    expect(handle.save).toHaveBeenCalledWith(quests, 'Quests saved');
  });

  it('lets the author choose an action trigger for a locked objective', () => {
    const { getByTitle, getByLabelText, getByText, handle } = renderQuests();

    fireEvent.click(getByTitle('Remove trigger'));
    fireEvent.click(getByTitle('Set an action trigger'));
    expect(getByLabelText('Action text')).toHaveValue('');

    fireEvent.click(getByText('save all'));
    const [[saved]] = (handle.save as Mock).mock.calls as [[JsonQuest[]]];
    expect(saved[0].objectives[0].trigger).toEqual({
      kind: 'action',
      text: '',
      effects: [],
    });
  });
});
