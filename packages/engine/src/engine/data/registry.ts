export class Registry<T> {
  private readonly label: string;
  private readonly map: Map<string, T>;

  constructor(label: string, map: Map<string, T>) {
    this.label = label;
    this.map = map;
  }

  get(id: string): T {
    const value = this.map.get(id);
    if (!value) {
      throw new Error(`Loader: ${this.label} not found: ${id}`);
    }
    return value;
  }

  has(id: string): boolean {
    return this.map.has(id);
  }

  all(): T[] {
    return Array.from(this.map.values());
  }
}

export function buildRegistry<T>(
  label: string,
  items: T[],
  idOf: (t: T) => string,
): Registry<T> {
  const map = new Map<string, T>();
  for (const item of items) {
    map.set(idOf(item), item);
  }
  return new Registry(label, map);
}
