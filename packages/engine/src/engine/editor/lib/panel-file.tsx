/* eslint-disable react-refresh/only-export-components */
import { type ReactNode, createContext, use } from 'react';

/**
 * The data-file base name (no extension, e.g. 'scenes') the active panel edits.
 * Provided by the router from each panel's manifest `file` so panels — and the
 * shared {@link usePanelEntries} hook — derive their endpoint and namespace
 * dynamically instead of hardcoding string literals.
 */
const PanelFileContext = createContext<string | null>(null);

export function PanelFileProvider({
  file,
  children,
}: {
  file: string;
  children: ReactNode;
}) {
  return <PanelFileContext value={file}>{children}</PanelFileContext>;
}

/** The data file the current panel edits. Throws if used outside a list panel. */
export function usePanelFile(): string {
  const file = use(PanelFileContext);
  if (file === null) {
    throw new Error('usePanelFile used outside a <PanelFileProvider>');
  }
  return file;
}
