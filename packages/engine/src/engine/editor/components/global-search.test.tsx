import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { GlobalSearch } from './global-search';

// cmdk measures its list with ResizeObserver, which jsdom lacks.
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  },
);
Element.prototype.scrollIntoView = () => undefined;

// Only items.json and locations.json exist; every other file the search reads
// (quests, events, encounters, skills, conversations, …) is absent (404), as
// optional content files may legitimately be.
const present: Record<string, unknown> = {
  items: [{ id: 'sword', name: 'Sword', kind: 'item' }],
  locations: [{ id: 'town', name: 'Town Square' }],
};
vi.stubGlobal('fetch', (url: string) => {
  const data = present[url.replace('/editor/api/data/', '')];
  return Promise.resolve(
    data === undefined
      ? ({ ok: false, status: 404 } as Response)
      : ({
          ok: true,
          status: 200,
          json: () => Promise.resolve(data),
        } as Response),
  );
});

describe('GlobalSearch', () => {
  it('searches the files present, skipping absent ones', async () => {
    render(
      <MemoryRouter>
        <GlobalSearch />
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByText('Search...'));

    expect(await screen.findByText('Sword')).toBeTruthy();
    expect(screen.getByText('Town Square')).toBeTruthy();
    expect(screen.queryByText('Quests')).toBeNull();
  });
});
