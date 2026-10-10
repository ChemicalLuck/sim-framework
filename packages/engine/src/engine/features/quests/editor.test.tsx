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

import type { JsonQuest, JsonQuestTemplate } from './authoring.types';
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
const QuestTemplatesPanel = editor.panels['quest-templates'].component;

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
  {
    id: 'bakery',
    name: 'Work at the bakery',
    objectives: [
      {
        name: 'bake',
        state: 'available',
        condition: {
          kind: 'action',
          text: 'Bake a cake',
          effects: [{ kind: 'money', amount: -5 }],
        },
      },
      {
        name: 'apply',
        state: 'available',
        condition: { kind: 'scene', sceneId: 'interview' },
      },
      {
        name: 'shift',
        state: 'available',
        condition: {
          kind: 'scene',
          text: 'You work a shift.',
          actions: [
            { actions: [{ kind: 'action', text: 'Leave', effects: [] }] },
          ],
        },
      },
    ],
  },
];

const templates: JsonQuestTemplate[] = [
  {
    id: 'meet',
    idTemplate: 'meet_{npc0.id}',
    name: 'Meet {npc0.firstName}',
    objectives: [
      {
        name: 'greet',
        state: 'available',
        condition: {
          kind: 'action',
          text: 'Greet {npc0.firstName}',
          effects: [],
        },
      },
      {
        name: 'go_out',
        state: 'locked',
        condition: { kind: 'scene', sceneId: 'date' },
      },
    ],
  },
];

function SaveButton() {
  const { saveAll } = useSaveContext();
  return <button onClick={saveAll}>save all</button>;
}

function renderQuests(entryId = 'job') {
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
    { initialEntries: [`/quests/${entryId}`] },
  );
  return { ...result, handle };
}

function renderTemplates() {
  const handle = mockEditorDataHandle(structuredClone(templates));
  (useEditorData as Mock).mockImplementation((url: string) =>
    url === '/editor/api/data/quest-templates'
      ? handle
      : mockEditorDataHandle([]),
  );
  const result = renderEditorPanel(
    <PanelFileProvider file="quest-templates">
      <Routes>
        <Route
          path="/quest-templates/:entryId?"
          element={
            <>
              <QuestTemplatesPanel />
              <SaveButton />
            </>
          }
        />
      </Routes>
    </PanelFileProvider>,
    { initialEntries: ['/quest-templates/meet'] },
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

  it('shows action and scene objectives as what they are', () => {
    const { getByText, getByLabelText, getByDisplayValue, queryByTitle } =
      renderQuests('bakery');

    expect(getByText('condition: action')).toBeInTheDocument();
    expect(getByLabelText('Action text')).toHaveValue('Bake a cake');
    expect(getByText('condition: scene')).toBeInTheDocument();
    expect(getByDisplayValue('interview')).toBeInTheDocument();
    expect(getByText('condition: inline scene')).toBeInTheDocument();
    expect(getByText('You work a shift.')).toBeInTheDocument();
    // None is offered as a condition to edit, which would replace it.
    expect(queryByTitle('Edit condition')).toBeNull();
  });

  it('preserves action and scene objectives on save', () => {
    const { getByText, handle } = renderQuests('bakery');
    fireEvent.click(getByText('save all'));
    expect(handle.save).toHaveBeenCalledWith(quests, 'Quests saved');
  });

  it('edits a scene objective by scene id, keeping the others', () => {
    const { getByText, getByDisplayValue, handle } = renderQuests('bakery');

    fireEvent.change(getByDisplayValue('interview'), {
      target: { value: 'nap' },
    });
    fireEvent.click(getByText('save all'));

    const [[saved]] = (handle.save as Mock).mock.calls as [[JsonQuest[]]];
    const expected = structuredClone(quests);
    expected[1].objectives[1].condition = { kind: 'scene', sceneId: 'nap' };
    expect(saved).toEqual(expected);
  });
});

describe('quest templates editor panel', () => {
  it('shows action and scene objectives as what they are', () => {
    const { getByText, getByLabelText, getByDisplayValue, queryByTitle } =
      renderTemplates();

    expect(getByText('condition: action')).toBeInTheDocument();
    expect(getByLabelText('Action text')).toHaveValue('Greet {npc0.firstName}');
    expect(getByText('condition: scene')).toBeInTheDocument();
    expect(getByDisplayValue('date')).toBeInTheDocument();
    expect(queryByTitle('Edit condition')).toBeNull();
  });

  it('preserves action and scene objectives on save', () => {
    const { getByText, handle } = renderTemplates();
    fireEvent.click(getByText('save all'));
    expect(handle.save).toHaveBeenCalledWith(templates, 'Templates saved');
  });

  it('lets the author choose an action objective', () => {
    const { getAllByTitle, getByText, handle } = renderTemplates();

    // The scene objective becomes an action.
    fireEvent.click(getAllByTitle('Set an action objective')[0]);
    fireEvent.click(getByText('save all'));

    const [[saved]] = (handle.save as Mock).mock.calls as [
      [JsonQuestTemplate[]],
    ];
    expect(saved[0].objectives[1].condition).toEqual({
      kind: 'action',
      text: '',
      effects: [],
    });
    expect(saved[0].objectives[0]).toEqual(templates[0].objectives[0]);
  });
});
