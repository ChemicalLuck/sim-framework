import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Condition } from '@chemicalluck/sim-engine/types/condition.types';

import { ObjectiveTriggerField } from './objective-trigger-field';
import type { ObjectiveTrigger } from './types';

// The real module pulls in every editor panel (and with them a whole game).
vi.mock('@chemicalluck/sim-engine/editor/lib/use-available-data', () => ({
  useAvailableData: () => ({}),
}));

// CodeMirror doesn't run under jsdom; a plain input stands in for the text.
vi.mock('@chemicalluck/sim-engine/editor/components/template-editor', () => ({
  TemplateEditor: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) => (
    <input
      aria-label="Action text"
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
      }}
    />
  ),
}));

const met: Condition = { kind: 'milestone', milestoneId: 'met' };

const actionTrigger: ObjectiveTrigger = {
  kind: 'action',
  text: 'Ask about the job',
  condition: met,
  effects: [{ kind: 'money', amount: 5 }],
};

describe('ObjectiveTriggerField', () => {
  it('shows an action trigger as an action: text, condition and effects', () => {
    const onChange = vi.fn();
    const { getByText, getAllByTitle, getByLabelText, queryByTitle } = render(
      <ObjectiveTriggerField trigger={actionTrigger} onChange={onChange} />,
    );

    expect(getByText('trigger: action')).toBeInTheDocument();
    expect(getByLabelText('Action text')).toHaveValue('Ask about the job');
    expect(getByText('if: milestone.met')).toBeInTheDocument();
    // One chip per effect, each opening the effect editor.
    expect(getAllByTitle('Click to edit')).toHaveLength(1);
    // Not offered as a condition to edit, which would drop the action.
    expect(queryByTitle('Edit trigger')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('edits an action trigger as an action, keeping its other parts', () => {
    const onChange = vi.fn();
    const { getByTitle, getByLabelText } = render(
      <ObjectiveTriggerField trigger={actionTrigger} onChange={onChange} />,
    );

    fireEvent.change(getByLabelText('Action text'), {
      target: { value: 'Ask again' },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      ...actionTrigger,
      text: 'Ask again',
    });

    fireEvent.click(getByTitle('Remove condition'));
    expect(onChange).toHaveBeenLastCalledWith({
      ...actionTrigger,
      condition: undefined,
      lockedText: undefined,
    });
  });

  it('removes an action trigger', () => {
    const onChange = vi.fn();
    const { getByTitle } = render(
      <ObjectiveTriggerField trigger={actionTrigger} onChange={onChange} />,
    );
    fireEvent.click(getByTitle('Remove trigger'));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('shows a condition trigger as a condition', () => {
    const { getByText, getByTitle } = render(
      <ObjectiveTriggerField trigger={met} onChange={vi.fn()} />,
    );
    expect(getByText('milestone.met')).toBeInTheDocument();
    expect(getByTitle('Edit trigger')).toBeInTheDocument();
  });

  it('lets the author choose an action trigger', () => {
    const onChange = vi.fn();
    const { getByTitle } = render(
      <ObjectiveTriggerField trigger={undefined} onChange={onChange} />,
    );
    fireEvent.click(getByTitle('Set an action trigger'));
    expect(onChange).toHaveBeenCalledWith({
      kind: 'action',
      text: '',
      effects: [],
    });
  });

  it('lets the author choose a condition trigger', () => {
    const onChange = vi.fn();
    const { getByTitle, getByRole } = render(
      <ObjectiveTriggerField trigger={undefined} onChange={onChange} />,
    );
    fireEvent.click(getByTitle('Set a condition trigger'));
    expect(getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
