import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithStore } from '@chemicalluck/sim-engine/test-utils/render';

import { SidebarComponentContext } from './sidebar/context';
import { Sidebar, SidebarContent, SidebarProvider } from './ui/sidebar';
import WithSidebar from './with-sidebar';

function TestSidebar() {
  return (
    <Sidebar>
      <SidebarContent>Sidebar stats</SidebarContent>
    </Sidebar>
  );
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  });
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

// 2025-09-15 08:30 UTC, a Monday
const TIMESTAMP = Date.UTC(2025, 8, 15, 8, 30);

function renderLayout() {
  return renderWithStore(
    <SidebarProvider>
      <SidebarComponentContext value={TestSidebar}>
        <WithSidebar>
          <p>Scene text</p>
        </WithSidebar>
      </SidebarComponentContext>
    </SidebarProvider>,
    {
      reducer: () => ({
        present: { time: { timestamp: TIMESTAMP }, money: 42.5 },
      }),
    },
  );
}

describe('WithSidebar on a phone', () => {
  beforeEach(() => {
    setViewportWidth(390);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the time and money in a top bar', () => {
    renderLayout();
    const bar = screen.getByRole('banner');
    expect(bar).toHaveTextContent('08:30');
    expect(bar).toHaveTextContent('Mon 15 Sept');
    expect(bar).toHaveTextContent('£42.50');
  });

  it('opens the sidebar from the menu button', () => {
    renderLayout();
    expect(screen.queryByText('Sidebar stats')).not.toBeInTheDocument();
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    });
    expect(screen.getByText('Sidebar stats')).toBeInTheDocument();
  });

  it('renders the page content', () => {
    renderLayout();
    expect(screen.getByText('Scene text')).toBeInTheDocument();
  });
});
