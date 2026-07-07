import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

// jsdom omits DOM APIs that Radix UI primitives rely on. Shim them so panel
// tests that mount Radix-based components don't crash. ESLint is overly
// confident about which globals exist; these conditionals are required for
// the polyfills to be idempotent across test runs.
/* eslint-disable @typescript-eslint/no-empty-function, @typescript-eslint/no-unnecessary-condition */
class ResizeObserverShim {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = ResizeObserverShim as unknown as typeof ResizeObserver;
}

if (typeof Element !== 'undefined') {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
  }
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = vi.fn(() => false);
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = vi.fn();
  }
}
/* eslint-enable @typescript-eslint/no-empty-function, @typescript-eslint/no-unnecessary-condition */
