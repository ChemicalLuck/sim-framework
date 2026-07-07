import { useCallback } from 'react';
import { toast } from 'sonner';
import {
  namespaceOf,
  requiredFiles,
  rewriteReferences,
} from '@chemicalluck/sim-engine/lib/validation';

import { usePanelFile } from './panel-file';
import { useRegisterSave } from './save-context';
import { type ConfirmState, useUnsavedChanges } from './unsaved-changes';
import {
  bumpDataEpoch,
  readEditorData,
  useEditorData,
  writeEditorData,
} from './use-editor-data';
import { useEntryParam } from './use-entry-param';
import { usePanelItems } from './use-panel-items';
import { contributions, useReferencesTo } from './validation';

const endpointFor = (file: string) => `/editor/api/data/${file}`;

export interface PanelEntriesOptions<T> {
  /** Toast message shown on save (defaults to a generic message). */
  saveMessage?: string;
  /**
   * Transforms the working items into the payload persisted on save. Receives
   * the current items and the last-saved originals. Defaults to the raw items.
   * Used e.g. by quests to cascade objective renames at save time.
   */
  onSave?: (items: T[], original: T[]) => unknown;
}

export interface PanelEntries<T> {
  items: Record<string, T>;
  ids: string[];
  selected: string | null;
  setSelected: (id: string | null) => void;
  saving: boolean;
  dirty: boolean;
  discard: () => void;
  confirmSelect: (callback: () => void) => void;
  confirmState: ConfirmState;
  handleChange: (id: string, updated: T) => void;
  handleAdd: (item: T) => void;
  handleClone: (sourceId: string, newId: string) => T | null;
  handleDelete: (id: string) => void;
  rename: (id: string, newId: string) => Promise<void>;
  referencesFor: (id: string) => string[];
}

/**
 * The unified state hook every editor list panel uses. Composes data loading,
 * staged-save tracking, URL selection, and the generic clone/delete/rename
 * actions — all driven by the panel's declared data `file` (from context), with
 * no per-panel namespace or endpoint literals.
 */
export function usePanelEntries<T extends { id: string }>(
  options: PanelEntriesOptions<T> = {},
): PanelEntries<T> {
  const file = usePanelFile();
  const endpoint = endpointFor(file);

  const {
    data: rawItems,
    original,
    saving,
    save,
    discard: discardRaw,
  } = useEditorData<T[]>(endpoint);

  const {
    items,
    ids,
    dirty,
    discard,
    confirmSelect,
    confirmState,
    handleChange,
    handleAdd,
    handleClone: cloneItem,
    handleDelete: deleteItem,
  } = usePanelItems(rawItems, discardRaw);

  const [selected, setSelected] = useEntryParam(ids);
  const referencesTo = useReferencesTo();
  const { dirty: globalDirty } = useUnsavedChanges();

  useRegisterSave({
    save: () => {
      const payload = options.onSave
        ? options.onSave(Object.values(items), original)
        : Object.values(items);
      void save(payload, options.saveMessage);
    },
    saving,
  });

  const handleClone = useCallback(
    (sourceId: string, newId: string): T | null => {
      const clone = cloneItem(sourceId, newId);
      if (clone) setSelected(clone.id);
      return clone;
    },
    [cloneItem, setSelected],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const { remaining } = deleteItem(id);
      setSelected(remaining[0] ?? null);
    },
    [deleteItem, setSelected],
  );

  const referencesFor = useCallback(
    (id: string): string[] => {
      const ns = namespaceOf(
        file,
        id,
        { [file]: Object.values(items) },
        contributions.idSources,
      );
      return ns ? referencesTo(ns, id) : [];
    },
    [file, items, referencesTo],
  );

  const rename = useCallback(
    async (id: string, newId: string): Promise<void> => {
      const trimmed = newId.trim();
      if (!trimmed || trimmed === id) return;
      if (id in items && trimmed in items) {
        toast.error(`An entry with id '${trimmed}' already exists.`);
        return;
      }
      if (globalDirty) {
        toast.error('Save or discard your changes before renaming.');
        return;
      }

      const sourceData = readEditorData(endpoint) as { id: string }[];
      const ns = namespaceOf(
        file,
        id,
        { [file]: sourceData },
        contributions.idSources,
      );

      const dataByFile = Object.fromEntries(
        requiredFiles(contributions).map((f) => [
          f,
          readEditorData(endpointFor(f)),
        ]),
      );

      const { changed, count } = ns
        ? rewriteReferences(dataByFile, contributions, ns, id, trimmed)
        : { changed: {} as Record<string, unknown>, count: 0 };

      // Rename the entry's own id in its file, merging with any same-file
      // reference rewrite that already happened above.
      const sourceArr =
        (changed[file] as { id: string }[] | undefined) ??
        structuredClone(sourceData);
      const entry = sourceArr.find((e) => e.id === id);
      if (!entry) {
        toast.error(`Cannot rename: '${id}' not found in ${file}.`);
        return;
      }
      entry.id = trimmed;
      changed[file] = sourceArr;

      try {
        await Promise.all(
          Object.entries(changed).map(([f, data]) =>
            writeEditorData(endpointFor(f), data),
          ),
        );
      } catch (e) {
        toast.error(`Rename failed: ${String(e)}`);
        return;
      }

      setSelected(trimmed);
      bumpDataEpoch();
      toast.success(
        `Renamed ${id} → ${trimmed}` +
          (count
            ? ` (${String(count)} reference${count === 1 ? '' : 's'} updated)`
            : ''),
      );
    },
    [endpoint, file, globalDirty, items, setSelected],
  );

  return {
    items,
    ids,
    selected,
    setSelected,
    saving,
    dirty,
    discard,
    confirmSelect,
    confirmState,
    handleChange,
    handleAdd,
    handleClone,
    handleDelete,
    rename,
    referencesFor,
  };
}
