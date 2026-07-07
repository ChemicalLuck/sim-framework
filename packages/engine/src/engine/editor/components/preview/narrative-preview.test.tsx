import { describe, expect, it } from 'vitest';
import type { JsonScene } from '@sim/engine/features/core/types';
import { parseCondition } from '@sim/engine/lib/conditions';
import { renderEditorPanel } from '@sim/engine/test-utils/render';

import { PreviewStateProvider } from './mock-state';
import { NarrativePreview } from './narrative-preview';

function renderPreview(ui: React.ReactElement) {
  return renderEditorPanel(<PreviewStateProvider>{ui}</PreviewStateProvider>);
}

describe('NarrativePreview', () => {
  it('renders a scene with a gated action shown as unmet against default state', () => {
    const scene: JsonScene = {
      kind: 'scene',
      text: 'You are in the shop.',
      actions: [
        {
          actions: [
            {
              kind: 'action',
              text: 'Buy luxury item',
              effects: [{ kind: 'money', amount: -5 } as never],
              // Default mock money is 100, so this is NOT met.
              condition: parseCondition('money >= 1000'),
            },
            { kind: 'action', text: 'Leave', effects: [] },
          ],
        },
      ],
    };

    const { getByText } = renderPreview(
      <NarrativePreview kind="scene" scene={scene} />,
    );

    expect(getByText('You are in the shop.')).toBeInTheDocument();
    expect(getByText(/Buy luxury item/)).toBeInTheDocument();
    expect(getByText(/Leave/)).toBeInTheDocument();
    // The gated action's condition renders an unmet (✕) badge.
    expect(getByText(/✕/)).toBeInTheDocument();
  });

  it('warns when an event references an unknown script', () => {
    const { getByText } = renderPreview(
      <NarrativePreview
        kind="event"
        event={{ id: 'e1', probability: 1, scriptId: 'ghost' }}
      />,
    );
    expect(getByText(/unknown script 'ghost'/)).toBeInTheDocument();
  });
});
