import type { Mock } from 'vitest';
import { describe, expect, it, vi } from 'vitest';
import { useEditorData } from '@chemicalluck/engine/editor/lib/use-editor-data';
import { mockEditorDataHandle, renderEditorPanel } from '@chemicalluck/engine/test-utils/render';

import editor from './editor';

vi.mock('@chemicalluck/engine/editor/lib/use-editor-data', () => ({
  useEditorData: vi.fn(),
  preloadEditorData: vi.fn(),
}));

const MoneyPanel = editor.panels.money.component;

describe('money editor panel', () => {
  it('registers as "Currency & Money" under the Core group', () => {
    expect(editor.panels.money.label).toBe('Currency & Money');
    expect(editor.panels.money.group).toBe('Core');
  });

  it('renders currency and starting money sections seeded from the API', () => {
    (useEditorData as Mock).mockImplementation((url: string) => {
      if (url === '/editor/api/data/currency')
        return mockEditorDataHandle({ code: 'GBP', locale: 'en-GB' });
      if (url === '/editor/api/data/initial-money')
        return mockEditorDataHandle(250);
      throw new Error(`Unexpected editor data url: ${url}`);
    });

    const { container, getByText, getByPlaceholderText } = renderEditorPanel(
      <MoneyPanel />,
    );
    expect(getByText('Currency & Money')).toBeInTheDocument();
    expect(getByText(/Starting Money/i)).toBeInTheDocument();

    const locale = getByPlaceholderText('en-GB') as HTMLInputElement;
    expect(locale.value).toBe('en-GB');

    const initial = container.querySelector<HTMLInputElement>(
      'input[type="number"]',
    );
    if (!initial) throw new Error('Initial Amount input not found');
    expect(initial.value).toBe('250');
  });
});
