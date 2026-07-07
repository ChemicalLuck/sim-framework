import type { IdSource } from '@chemicalluck/sim-engine/lib/validation';

// Event references themselves are emitted from action `eventIds` by the shared
// content walker; this feature just provides the registry of valid event ids.
export const idSources: IdSource[] = [
  {
    namespace: 'event',
    file: 'events',
    select: (data) => (data as { id: string }[]).map((e) => e.id),
  },
];
