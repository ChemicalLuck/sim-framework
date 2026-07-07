import type { Mock } from 'vitest';
import { describe, expect, it, vi } from 'vitest';
import { useEditorData } from '@chemicalluck/engine/editor/lib/use-editor-data';
import { mockEditorDataHandle, renderEditorPanel } from '@chemicalluck/engine/test-utils/render';

import editor from './editor';

vi.mock('@chemicalluck/engine/editor/lib/use-editor-data', () => ({
  useEditorData: vi.fn(),
  preloadEditorData: vi.fn(),
}));

const WearablesConfigPanel = editor.panels['wearables-config'].component;

describe('outfits/wearables-config editor panel', () => {
  it('registers as "Wearable Config" under the Core group', () => {
    expect(editor.panels['wearables-config'].label).toBe('Wearable Config');
    expect(editor.panels['wearables-config'].group).toBe('Core');
  });

  it('renders the slot, category, and styles sections seeded from the API', () => {
    (useEditorData as Mock).mockReturnValue(
      mockEditorDataHandle({
        slots: ['hat', 'pants'],
        categories: ['top', 'bottom'],
        slotCategoryMap: { hat: 'top', pants: 'bottom' },
        styles: ['casual'],
        appearanceKeys: ['color1'],
      }),
    );

    const { getByText, getAllByText } = renderEditorPanel(
      <WearablesConfigPanel />,
    );
    expect(getByText('Wearable Config')).toBeInTheDocument();
    expect(getAllByText('hat').length).toBeGreaterThan(0);
    expect(getAllByText('pants').length).toBeGreaterThan(0);
    expect(getByText('casual')).toBeInTheDocument();
    expect(getByText('color1')).toBeInTheDocument();
  });
});
