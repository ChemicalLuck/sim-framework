/**
 * Helpers for the Vite plugins that generate virtual modules from feature and
 * extension folder names. Folder names need not be JS identifiers (`my-ext`,
 * `2d`), so every generated binding goes through these.
 */

const IDENTIFIER_RE = /^[A-Za-z_$][\w$]*$/;

export function isIdentifier(s: string): boolean {
  return IDENTIFIER_RE.test(s);
}

/** Turn a folder name into identifier text: `my-ext` → `myExt`, `2d` → `_2d`. */
export function toIdentifier(s: string): string {
  const id = s
    .replace(/-([a-zA-Z])/g, (_, c: string) => c.toUpperCase())
    .replace(/[^\w$]/g, '_');
  return /^\d/.test(id) ? `_${id}` : id;
}

/**
 * Returns a function that makes `toIdentifier(base)` unique within one
 * generated module, appending `_2`, `_3`, … on a clash (`my-ext` and `myExt`
 * both become `myExt…`).
 */
export function createIdentifierAllocator(): (base: string) => string {
  const used = new Set<string>();
  return (base) => {
    const id = toIdentifier(base);
    let unique = id;
    for (let n = 2; used.has(unique); n++) unique = `${id}_${String(n)}`;
    used.add(unique);
    return unique;
  };
}

/** An export/import name: bare when an identifier, else a string literal. */
export function moduleExportName(name: string): string {
  return isIdentifier(name) ? name : JSON.stringify(name);
}
