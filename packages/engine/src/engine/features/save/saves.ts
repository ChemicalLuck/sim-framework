export interface GameSaveMetadata {
  name: string; // player-provided save name
  timestamp: string; // ISO string
  characterName: string;
  inGameTime: string; // e.g., "12:30 PM"
  storageKey: string; // actual key in localStorage
  /** Made by an `autosave` effect rather than the player. */
  auto?: boolean;
  /** Author-provided label of an autosave, e.g. "Woke up". */
  label?: string;
  /** Permanent checkpoint autosave: never rotated out. */
  keep?: boolean;
}

const SAVE_SLOTS_KEY = 'saveSlots';

export function getSaveSlots(): GameSaveMetadata[] {
  const raw = localStorage.getItem(SAVE_SLOTS_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as GameSaveMetadata[];
}

export function getManualSaveSlots(): GameSaveMetadata[] {
  return getSaveSlots().filter((s) => !s.auto);
}

export function getAutosaveSlots(): GameSaveMetadata[] {
  return getSaveSlots().filter((s) => s.auto);
}

export function addSaveSlot(metadata: GameSaveMetadata) {
  const slots = getSaveSlots();
  slots.push(metadata);
  localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(slots));
}

export function saveGame(
  name: string,
  characterName: string,
  inGameTime: string,
) {
  const storageKey = `save_${Date.now().toString()}`; // unique key
  const state = localStorage.getItem('persist:root') ?? '';
  localStorage.setItem(storageKey, state);

  addSaveSlot({
    name,
    timestamp: new Date().toISOString(),
    characterName,
    inGameTime,
    storageKey,
  });
}

// redux-persist writes `persist:root` lazily; the store registers its flush so
// an autosave snapshots the latest state rather than a slightly stale one.
let _flushPersist: (() => Promise<unknown>) | null = null;

export function registerPersistFlush(flush: (() => Promise<unknown>) | null) {
  _flushPersist = flush;
}

export function flushPersist(): Promise<unknown> {
  return _flushPersist ? _flushPersist() : Promise.resolve();
}

export interface AutosaveRequest {
  label?: string;
  keep?: boolean;
  /** Rotating (non-kept) autosaves to retain, newest first. */
  rotate: number;
  characterName: string;
  inGameTime: string;
}

/**
 * Copy the persisted state into a new autosave slot (same format as manual
 * saves), then drop the oldest rotating autosaves beyond `rotate`. Kept
 * checkpoints and manual saves are never rotated out. Returns the new slot, or
 * null when rotating autosaves are disabled (`rotate` 0).
 */
export function createAutosave({
  label,
  keep,
  rotate,
  characterName,
  inGameTime,
}: AutosaveRequest): GameSaveMetadata | null {
  if (!keep && rotate <= 0) return null;

  const storageKey = `autosave_${Date.now().toString()}_${crypto.randomUUID()}`;
  localStorage.setItem(storageKey, localStorage.getItem('persist:root') ?? '');

  const slot: GameSaveMetadata = {
    name: label ?? 'Autosave',
    timestamp: new Date().toISOString(),
    characterName,
    inGameTime,
    storageKey,
    auto: true,
    ...(label !== undefined && { label }),
    ...(keep && { keep: true }),
  };

  const slots = [...getSaveSlots(), slot];
  const rotating = slots.filter((s) => s.auto && !s.keep);
  const expired = new Set(
    rotating.slice(0, Math.max(0, rotating.length - rotate)),
  );
  for (const s of expired) localStorage.removeItem(s.storageKey);
  localStorage.setItem(
    SAVE_SLOTS_KEY,
    JSON.stringify(slots.filter((s) => !expired.has(s))),
  );
  return slot;
}

export function loadGame(slot: GameSaveMetadata) {
  const saved = localStorage.getItem(slot.storageKey);
  if (!saved) return;

  localStorage.setItem('persist:root', saved);
  window.location.reload();
}
