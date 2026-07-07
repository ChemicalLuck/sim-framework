import type { Mock } from 'vitest';
import { describe, expect, it, vi } from 'vitest';
import { useEditorData } from '@chemicalluck/sim-engine/editor/lib/use-editor-data';
import { mockEditorDataHandle, renderEditorPanel } from '@chemicalluck/sim-engine/test-utils/render';

import editor from './editor';

vi.mock('@chemicalluck/sim-engine/editor/lib/use-editor-data', () => ({
  useEditorData: vi.fn(),
  preloadEditorData: vi.fn(),
}));

const TimeConfigPanel = editor.panels['game-time'].component;

describe('time editor panel', () => {
  it('exposes the panel under the Core group with label "Game Time"', () => {
    expect(editor.panels['game-time'].label).toBe('Game Time');
    expect(editor.panels['game-time'].group).toBe('Core');
  });

  it('renders the configured ISO start as a datetime-local input', () => {
    (useEditorData as Mock).mockReturnValue(
      mockEditorDataHandle('2026-01-01T10:00:00.000Z'),
    );

    const { container, getByText } = renderEditorPanel(<TimeConfigPanel />);
    expect(getByText('Game Time')).toBeInTheDocument();
    expect(getByText(/Game Start Date/i)).toBeInTheDocument();
    const input = container.querySelector<HTMLInputElement>(
      'input[type="datetime-local"]',
    );
    if (!input) throw new Error('datetime-local input not found');
    expect(input.value).toBe('2026-01-01T10:00');
  });
});
