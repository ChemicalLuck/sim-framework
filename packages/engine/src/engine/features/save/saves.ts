export interface GameSaveMetadata {
  name: string; // player-provided save name
  timestamp: string; // ISO string
  characterName: string;
  inGameTime: string; // e.g., "12:30 PM"
  storageKey: string; // actual key in localStorage
}

const SAVE_SLOTS_KEY = 'saveSlots';

export function getSaveSlots(): GameSaveMetadata[] {
  const raw = localStorage.getItem(SAVE_SLOTS_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as GameSaveMetadata[];
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

export function loadGame(slot: GameSaveMetadata) {
  const saved = localStorage.getItem(slot.storageKey);
  if (!saved) return;

  localStorage.setItem('persist:root', saved);
  window.location.reload();
}
