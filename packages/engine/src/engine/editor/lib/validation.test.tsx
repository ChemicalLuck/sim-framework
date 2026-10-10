import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// validation.tsx preloads every file the reference contributions read as soon
// as it is imported, so fetch must be stubbed before the module loads. Only
// needs.json "exists"; every other file is absent (404), as optional content
// files like weather.json or quests.json may legitimately be.
vi.hoisted(() => {
  const needs = {
    needs: { Energy: 100 },
    decayRates: { Energy: 5 },
    options: {
      Energy: {
        thresholds: [
          {
            below: 10,
            effects: [{ kind: 'needs', need: 'Stamina', delta: -1 }],
          },
        ],
      },
    },
  };
  globalThis.fetch = ((url: string) =>
    Promise.resolve(
      url === '/editor/api/data/needs'
        ? ({
            ok: true,
            status: 200,
            json: () => Promise.resolve(needs),
          } as Response)
        : ({ ok: false, status: 404 } as Response),
    )) as typeof fetch;
});

const { ValidationProvider, useValidationIssues } = await import(
  './validation'
);

function Issues() {
  const issues = useValidationIssues();
  return (
    <ul>
      {issues.map((i) => (
        <li key={`${i.source}${i.message}`}>{`${i.source}: ${i.message}`}</li>
      ))}
    </ul>
  );
}

describe('ValidationProvider', () => {
  it('validates the files present, treating missing files as absent', async () => {
    render(
      <ValidationProvider>
        <Issues />
      </ValidationProvider>,
    );
    await waitFor(() => {
      expect(
        screen.getByText("need:Energy: references unknown need 'Stamina'"),
      ).toBeTruthy();
    });
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });
});
