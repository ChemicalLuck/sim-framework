import { Copy, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@sim/engine/components/ui/alert-dialog';
import { Button } from '@sim/engine/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@sim/engine/components/ui/dialog';
import { Field, FieldGroup } from '@sim/engine/components/ui/field';
import { Input } from '@sim/engine/components/ui/input';
import { Label } from '@sim/engine/components/ui/label';
import { ScrollArea } from '@sim/engine/components/ui/scroll-area';
import { Skeleton } from '@sim/engine/components/ui/skeleton';

// ── InlineEdit ───────────────────────────────────────────────────

interface InlineEditProps {
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
}

export function InlineEdit({ value, onCommit, placeholder }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function commit() {
    setEditing(false);
    if (draft !== value) onCommit(draft);
  }

  if (editing) {
    return (
      <Input
        autoFocus
        value={draft}
        placeholder={placeholder}
        onChange={(e) => {
          setDraft(e.target.value);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setDraft(value);
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      className="w-full text-left px-2 py-1 rounded text-sm hover:bg-zinc-700 cursor-text min-h-[2rem] flex items-center"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
    >
      {value || <span className="text-zinc-500">{placeholder}</span>}
    </button>
  );
}

// ── PanelSkeleton ─────────────────────────────────────────────────

interface PanelSkeletonProps {
  sidebarWidth?: string;
}

export function PanelSkeleton({ sidebarWidth = 'w-52' }: PanelSkeletonProps) {
  return (
    <div className="flex h-full">
      <div
        className={`${sidebarWidth} p-3 space-y-2 border-r border-zinc-700 shrink-0`}
      >
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-7 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
      </div>
      <div className="flex-1 p-4 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

// ── PanelError ────────────────────────────────────────────────────

interface PanelErrorProps {
  error: string;
  hint?: string;
}

export function PanelError({ error, hint }: PanelErrorProps) {
  return (
    <div className="p-4 text-red-400 text-sm">
      {error}
      {hint && (
        <p className="text-zinc-500 text-xs mt-1">
          Ensure <code>{hint}</code> exists and is valid JSON.
        </p>
      )}
    </div>
  );
}

// ── PanelErrorBoundary ────────────────────────────────────────────

interface PanelErrorBoundaryState {
  error: string | null;
}

export class PanelErrorBoundary extends React.Component<
  React.PropsWithChildren,
  PanelErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: unknown): PanelErrorBoundaryState {
    return { error: String(error) };
  }

  override render() {
    if (this.state.error) {
      return <PanelError error={this.state.error} />;
    }
    return this.props.children;
  }
}

// ── AddDialog ─────────────────────────────────────────────────────

interface AddDialogProps {
  label: string;
  onSubmit: () => void;
  canSubmit: boolean;
  children: React.ReactNode;
}

export function AddDialog({
  label,
  onSubmit,
  canSubmit,
  children,
}: AddDialogProps) {
  const [open, setOpen] = useState(false);

  function handleSubmit() {
    onSubmit();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="flex items-center justify-between">
          <DialogTitle>{label}</DialogTitle>
          <DialogClose />
        </DialogHeader>
        <FieldGroup>{children}</FieldGroup>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── CloneDialog ───────────────────────────────────────────────────

interface CloneDialogProps {
  sourceId: string;
  /** All existing ids, used to reject a duplicate new id. */
  existingKeys: string[];
  onConfirm: (newId: string) => void;
  onClose: () => void;
}

export function CloneDialog({
  sourceId,
  existingKeys,
  onConfirm,
  onClose,
}: CloneDialogProps) {
  const [value, setValue] = useState(`${sourceId}_copy`);
  const trimmed = value.trim();
  const taken = existingKeys.includes(trimmed);
  const canSubmit = !!trimmed && !taken;

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader className="flex items-center justify-between">
          <DialogTitle>Clone &ldquo;{sourceId}&rdquo;</DialogTitle>
          <DialogClose />
        </DialogHeader>
        <FieldGroup>
          <Field>
            <Label>New id</Label>
            <Input
              autoFocus
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canSubmit) onConfirm(trimmed);
              }}
            />
            {taken && (
              <p className="text-xs text-red-400">
                An entry with this id already exists.
              </p>
            )}
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button
            disabled={!canSubmit}
            onClick={() => {
              onConfirm(trimmed);
            }}
          >
            Clone
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── SidebarToolbar ────────────────────────────────────────────────

interface SidebarToolbarProps {
  add: React.ReactNode;
  search: string;
  onSearch: (q: string) => void;
  searchPlaceholder?: string;
  count: number;
  total: number;
  children?: React.ReactNode;
}

export function SidebarToolbar({
  add,
  search,
  onSearch,
  searchPlaceholder,
  count,
  total,
  children,
}: SidebarToolbarProps) {
  return (
    <FieldGroup className="p-3 border-b border-zinc-700 shrink-0">
      {add}
      <Field>
        <Input
          value={search}
          onChange={(e) => {
            onSearch(e.target.value);
          }}
          placeholder={searchPlaceholder ?? 'Search...'}
        />
      </Field>
      {children}
      <p className="text-xs text-zinc-500">
        {count} of {total}
      </p>
    </FieldGroup>
  );
}

// ── DataList ──────────────────────────────────────────────────────

interface DataListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  selected: string | null;
  onSelect: (key: string) => void;
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
  emptyText?: string;
  /** Full set of ids (unfiltered), used to reject a duplicate clone id. */
  allKeys?: string[];
  /** When provided, each row shows a clone icon that opens a new-id dialog. */
  onClone?: (item: T, newId: string) => void;
  /** When provided, each row shows a delete icon with a confirm dialog. */
  onDelete?: (item: T) => void;
  /** Inbound references to an entry, surfaced in the delete confirmation. */
  getReferences?: (item: T) => string[];
}

export function DataList<T>({
  items,
  getKey,
  selected,
  onSelect,
  renderItem,
  emptyText = 'No items match.',
  allKeys,
  onClone,
  onDelete,
  getReferences,
}: DataListProps<T>) {
  const [cloneSource, setCloneSource] = useState<T | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const hasActions = !!onClone || !!onDelete;
  const deleteRefs = deleteTarget ? (getReferences?.(deleteTarget) ?? []) : [];

  return (
    <ScrollArea>
      {items.map((item) => {
        const key = getKey(item);
        const isSelected = key === selected;
        return (
          <div
            key={key}
            className={`group flex items-stretch border-b border-zinc-800 transition-colors ${
              isSelected ? 'bg-zinc-700' : 'hover:bg-zinc-800'
            }`}
          >
            <button
              onClick={() => {
                onSelect(key);
              }}
              className={`flex-1 min-w-0 text-left px-3 py-2 ${
                isSelected
                  ? 'text-white'
                  : 'text-zinc-400 group-hover:text-zinc-200'
              }`}
            >
              {renderItem(item, isSelected)}
            </button>
            {hasActions && (
              <div className="flex items-center gap-0.5 pr-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                {onClone && (
                  <button
                    type="button"
                    title="Clone"
                    onClick={() => {
                      setCloneSource(item);
                    }}
                    className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700"
                  >
                    <Copy size={13} />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => {
                      setDeleteTarget(item);
                    }}
                    className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-700"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
      {items.length === 0 && (
        <p className="px-3 py-4 text-xs text-zinc-600 italic">{emptyText}</p>
      )}

      {cloneSource && onClone && (
        <CloneDialog
          sourceId={getKey(cloneSource)}
          existingKeys={allKeys ?? items.map(getKey)}
          onClose={() => {
            setCloneSource(null);
          }}
          onConfirm={(newId) => {
            onClone(cloneSource, newId);
            setCloneSource(null);
          }}
        />
      )}

      {deleteTarget && onDelete && (
        <ConfirmDialog
          open
          title={`Delete ${getKey(deleteTarget)}?`}
          description={
            deleteRefs.length > 0
              ? `This entry is still referenced in ${String(deleteRefs.length)} place${deleteRefs.length === 1 ? '' : 's'}. Deleting it will leave those references broken.`
              : 'This will remove the entry from the working set. The change is staged until you Save.'
          }
          details={
            deleteRefs.length > 0 ? (
              <ul className="max-h-40 overflow-auto space-y-0.5 rounded border border-zinc-700 bg-zinc-900/60 p-2 text-xs text-zinc-400">
                {deleteRefs.map((ref) => (
                  <li key={ref} className="font-mono">
                    {ref}
                  </li>
                ))}
              </ul>
            ) : undefined
          }
          confirmLabel={deleteRefs.length > 0 ? 'Delete anyway' : 'Delete'}
          onConfirm={() => {
            onDelete(deleteTarget);
            setDeleteTarget(null);
          }}
          onCancel={() => {
            setDeleteTarget(null);
          }}
        />
      )}
    </ScrollArea>
  );
}

// ── SaveBar ───────────────────────────────────────────────────────

interface SaveBarProps {
  saving: boolean;
  dirty: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

export function SaveBar({ saving, dirty, onSave, onDiscard }: SaveBarProps) {
  if (!dirty && !saving) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-amber-400">Unsaved changes pending</span>
      <Button size="sm" variant="outline" onClick={onDiscard} disabled={saving}>
        Discard
      </Button>
      <Button size="sm" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </div>
  );
}

// ── DeleteButton ──────────────────────────────────────────────────

interface DeleteButtonProps {
  onConfirm: () => void;
  label?: string;
  title?: string;
  description?: string;
  /**
   * Inbound references to the entity being deleted. When non-empty, the
   * confirm dialog warns that deleting will leave these references broken.
   */
  references?: string[];
  disabled?: boolean;
}

const NO_REFS: string[] = [];

export function DeleteButton({
  onConfirm,
  label = 'item',
  title,
  description,
  references = NO_REFS,
  disabled,
}: DeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const hasRefs = references.length > 0;
  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setOpen(true);
        }}
        disabled={disabled}
        className="text-zinc-500 hover:text-red-400"
        title={`Delete ${label}`}
      >
        <Trash2 size={14} />
      </Button>
      <ConfirmDialog
        open={open}
        title={title ?? `Delete ${label}?`}
        description={
          hasRefs
            ? `This ${label} is still referenced in ${String(references.length)} place${references.length === 1 ? '' : 's'}. Deleting it will leave those references broken.`
            : (description ??
              `This will remove the ${label} from the working set. The change is staged until you Save.`)
        }
        details={
          hasRefs ? (
            <ul className="max-h-40 overflow-auto space-y-0.5 rounded border border-zinc-700 bg-zinc-900/60 p-2 text-xs text-zinc-400">
              {references.map((ref) => (
                <li key={ref} className="font-mono">
                  {ref}
                </li>
              ))}
            </ul>
          ) : undefined
        }
        confirmLabel={hasRefs ? 'Delete anyway' : 'Delete'}
        onConfirm={() => {
          setOpen(false);
          onConfirm();
        }}
        onCancel={() => {
          setOpen(false);
        }}
      />
    </>
  );
}

// ── ConfirmDialog ─────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  /** Optional extra content rendered below the description (e.g. a ref list). */
  details?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  details,
  confirmLabel = 'Discard changes',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {details}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── PanelLayout ───────────────────────────────────────────────────

interface PanelLayoutProps {
  sidebarWidth?: string;
  sidebar: React.ReactNode;
  entityId?: string;
  /**
   * When provided, the entity id becomes inline-editable; committing a new id
   * opens a confirmation (reporting `references`) and then calls `onRename`.
   */
  onRename?: (newId: string) => void;
  /** Inbound references to `entityId`, surfaced in the rename confirmation. */
  references?: string[];
  children: React.ReactNode;
}

export function PanelLayout({
  sidebarWidth = 'w-auto',
  sidebar,
  entityId,
  onRename,
  references = NO_REFS,
  children,
}: PanelLayoutProps) {
  const [pendingRename, setPendingRename] = useState<string | null>(null);

  return (
    <div className="flex h-full">
      <div
        className={`${sidebarWidth} shrink-0 border-r border-zinc-700 flex flex-col overflow-hidden`}
      >
        {sidebar}
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea>
          <div className="p-4">
            {entityId &&
              (onRename ? (
                <div className="mb-3 max-w-xs font-mono text-xs text-zinc-300">
                  <InlineEdit
                    value={entityId}
                    placeholder="entry id"
                    onCommit={(next) => {
                      const trimmed = next.trim();
                      if (trimmed && trimmed !== entityId) {
                        setPendingRename(trimmed);
                      }
                    }}
                  />
                </div>
              ) : (
                <code className="text-xs text-zinc-500 mb-3 block">
                  {entityId}
                </code>
              ))}
            {children}
          </div>
        </ScrollArea>
      </div>
      {pendingRename !== null && entityId && (
        <ConfirmDialog
          open
          title={`Rename "${entityId}" → "${pendingRename}"?`}
          description={
            references.length > 0
              ? `This id is referenced in ${String(references.length)} place${references.length === 1 ? '' : 's'}. Renaming will update all of them automatically.`
              : 'No references point to this id. Only the entry itself will be renamed.'
          }
          details={
            references.length > 0 ? (
              <ul className="max-h-40 overflow-auto space-y-0.5 rounded border border-zinc-700 bg-zinc-900/60 p-2 text-xs text-zinc-400">
                {references.map((ref) => (
                  <li key={ref} className="font-mono">
                    {ref}
                  </li>
                ))}
              </ul>
            ) : undefined
          }
          confirmLabel="Rename"
          onConfirm={() => {
            onRename?.(pendingRename);
            setPendingRename(null);
          }}
          onCancel={() => {
            setPendingRename(null);
          }}
        />
      )}
    </div>
  );
}
