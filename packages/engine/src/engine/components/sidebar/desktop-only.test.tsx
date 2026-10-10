import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SidebarProvider } from '../ui/sidebar';
import { DesktopOnly } from './desktop-only';

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  });
}

function renderInSidebar() {
  render(
    <SidebarProvider>
      <DesktopOnly>
        <p>Stats</p>
      </DesktopOnly>
    </SidebarProvider>,
  );
}

describe('DesktopOnly', () => {
  afterEach(() => {
    setViewportWidth(1024);
  });

  it('shows its content on a desktop', () => {
    setViewportWidth(1280);
    renderInSidebar();
    expect(screen.getByText('Stats')).toBeInTheDocument();
  });

  it('hides its content on a phone, where the top bar shows it', () => {
    setViewportWidth(390);
    renderInSidebar();
    expect(screen.queryByText('Stats')).not.toBeInTheDocument();
  });
});
