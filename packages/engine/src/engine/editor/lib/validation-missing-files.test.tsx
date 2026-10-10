import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// validation.tsx preloads every file the reference contributions read as soon
// as it is imported, so fetch must be stubbed before the module loads. Only
// items.json exists; every other file is absent (404).
vi.hoisted(() => {
  globalThis.fetch = ((url: string) =>
    Promise.resolve(
      url === '/editor/api/data/items'
        ? ({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response)
        : ({ ok: false, status: 404 } as Response),
    )) as typeof fetch;
});

const { ValidationProvider, useMissingRequiredFiles } = await import(
  './validation'
);

function Missing() {
  const files = useMissingRequiredFiles();
  return <p>{files.length ? files.join(',') : 'none'}</p>;
}

describe('useMissingRequiredFiles', () => {
  it('lists absent required files, not absent optional ones', async () => {
    render(
      <ValidationProvider>
        <Missing />
      </ValidationProvider>,
    );
    await waitFor(() => {
      expect(screen.queryByText('none')).toBeNull();
    });
    const missing = screen.getByRole('paragraph').textContent.split(',');
    expect(missing).toContain('locations');
    expect(missing).not.toContain('items');
    for (const optional of ['quests', 'events', 'encounters', 'weather'])
      expect(missing).not.toContain(optional);
  });
});
