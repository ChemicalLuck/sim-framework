import { configureStore } from '@reduxjs/toolkit';
import { type RenderOptions, render } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';
import { SaveHandlerProvider } from '@chemicalluck/engine/editor/lib/save-context';
import { UnsavedChangesProvider } from '@chemicalluck/engine/editor/lib/unsaved-changes';
import type { EditorDataHandle } from '@chemicalluck/engine/editor/lib/use-editor-data';

// Reducers come in many shapes across features; tests use this loosely.
type TestReducers = Parameters<typeof configureStore>[0]['reducer'];

export function createTestStore(reducer: TestReducers) {
  return configureStore({ reducer });
}

export type TestStore = ReturnType<typeof createTestStore>;

interface RenderWithStoreOptions extends Omit<RenderOptions, 'wrapper'> {
  reducer: TestReducers;
}

export function renderWithStore(
  ui: ReactElement,
  options: RenderWithStoreOptions,
) {
  const { reducer, ...rest } = options;
  const store = createTestStore(reducer);
  const result = render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    ),
    ...rest,
  });
  return { ...result, store };
}

interface RenderEditorPanelOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

export function renderEditorPanel(
  ui: ReactElement,
  options: RenderEditorPanelOptions = {},
) {
  const { initialEntries = ['/'], ...rest } = options;
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={initialEntries}>
        <UnsavedChangesProvider>
          <SaveHandlerProvider>{children}</SaveHandlerProvider>
        </UnsavedChangesProvider>
      </MemoryRouter>
    ),
    ...rest,
  });
}

export function mockEditorDataHandle<T>(data: T): EditorDataHandle<T> {
  return {
    data,
    original: data,
    setData: vi.fn(),
    saving: false,
    save: vi.fn().mockResolvedValue(undefined),
    discard: vi.fn(),
  };
}
