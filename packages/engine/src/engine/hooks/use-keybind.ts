import * as React from 'react';

const KEYBIND_SEQUENCE: readonly string[] = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'ctrl+0',
  'ctrl+1',
  'ctrl+2',
  'ctrl+3',
  'ctrl+4',
  'ctrl+5',
  'ctrl+6',
  'ctrl+7',
  'ctrl+8',
  'ctrl+9',
];

const activeKeybinds = new Set<string>();

function claimNextKeybind(): string | null {
  for (const key of KEYBIND_SEQUENCE) {
    if (!activeKeybinds.has(key)) {
      activeKeybinds.add(key);
      return key;
    }
  }
  return null;
}

function releaseKeybind(key: string): void {
  activeKeybinds.delete(key);
}

function matchesKeybind(event: KeyboardEvent, keybind: string): boolean {
  const parts = keybind.split('+');
  const key = parts[parts.length - 1];
  const ctrl = parts.includes('ctrl');
  return (
    event.key === key &&
    event.ctrlKey === ctrl &&
    !event.altKey &&
    !event.shiftKey &&
    !event.metaKey
  );
}

export function useKeybind(callback: () => void): string | null {
  const [keybind, setKeybind] = React.useState<string | null>(null);
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;

  React.useEffect(() => {
    const claimed = claimNextKeybind();
    setKeybind(claimed);

    if (!claimed) return;

    const handler = (event: KeyboardEvent) => {
      if (matchesKeybind(event, claimed)) {
        event.preventDefault();
        callbackRef.current();
      }
    };

    window.addEventListener('keydown', handler);

    return () => {
      window.removeEventListener('keydown', handler);
      releaseKeybind(claimed);
      setKeybind(null);
    };
  }, []);

  return keybind;
}
