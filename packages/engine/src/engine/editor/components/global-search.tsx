import { Search } from 'lucide-react';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@chemicalluck/engine/components/ui/command';

import { useEditorData } from '../lib/use-editor-data';

interface SearchResult {
  id: string;
  label: string;
  category: string;
  path: string;
}

function useAllSearchData(): SearchResult[] {
  const { data: items } = useEditorData<
    { id: string; name: string; kind: string }[]
  >('/editor/api/data/items');
  const { data: wearableTemplates } = useEditorData<
    { id: string; name: string }[]
  >('/editor/api/data/wearable-templates');
  const { data: locations } = useEditorData<{ id: string; name: string }[]>(
    '/editor/api/data/locations',
  );
  const { data: encounters } = useEditorData<{ id: string; name: string }[]>(
    '/editor/api/data/encounters',
  );
  const { data: quests } = useEditorData<{ id: string; name: string }[]>(
    '/editor/api/data/quests',
  );
  const { data: skills } = useEditorData<{ id: string; name: string }[]>(
    '/editor/api/data/skills',
  );
  const { data: scenes } = useEditorData<{ id: string }[]>(
    '/editor/api/data/scenes',
  );
  const { data: scripts } = useEditorData<{ id: string }[]>(
    '/editor/api/data/scripts',
  );
  const { data: shops } = useEditorData<{ id: string }[]>(
    '/editor/api/data/shops',
  );
  const { data: questTemplates } = useEditorData<{ id: string }[]>(
    '/editor/api/data/quest-templates',
  );
  const { data: conversations } = useEditorData<{ id: string }[]>(
    '/editor/api/data/conversations',
  );
  const { data: events } = useEditorData<{ id: string }[]>(
    '/editor/api/data/events',
  );
  return useMemo(
    () => [
      ...items
        .filter((i) => i.kind === 'item')
        .map((i) => ({
          id: i.id,
          label: i.name,
          category: 'Items',
          path: `/editor/items/${i.id}`,
        })),
      ...items
        .filter((i) => i.kind === 'wearable')
        .map((i) => ({
          id: i.id,
          label: i.name,
          category: 'Wearables',
          path: `/editor/items/${i.id}`,
        })),
      ...wearableTemplates.map((t) => ({
        id: t.id,
        label: t.name,
        category: 'Wearable Templates',
        path: `/editor/templates/${t.id}`,
      })),
      ...locations.map((l) => ({
        id: l.id,
        label: l.name,
        category: 'Locations',
        path: `/editor/locations/${l.id}`,
      })),
      ...encounters.map((e) => ({
        id: e.id,
        label: e.name,
        category: 'Encounters',
        path: `/editor/encounters/${e.id}`,
      })),
      ...quests.map((q) => ({
        id: q.id,
        label: q.name,
        category: 'Quests',
        path: `/editor/quests/${q.id}`,
      })),
      ...skills.map((s) => ({
        id: s.id,
        label: s.name,
        category: 'Skills',
        path: `/editor/skills/${s.id}`,
      })),
      ...scenes.map((s) => ({
        id: s.id,
        label: s.id,
        category: 'Scenes',
        path: `/editor/scenes/${s.id}`,
      })),
      ...scripts.map((s) => ({
        id: s.id,
        label: s.id,
        category: 'Scripts',
        path: `/editor/scripts/${s.id}`,
      })),
      ...shops.map((s) => ({
        id: s.id,
        label: s.id,
        category: 'Shops',
        path: `/editor/shops/${s.id}`,
      })),
      ...questTemplates.map((t) => ({
        id: t.id,
        label: t.id,
        category: 'Quest Templates',
        path: `/editor/quest-templates/${t.id}`,
      })),
      ...conversations.map((c) => ({
        id: c.id,
        label: c.id,
        category: 'Conversations',
        path: `/editor/conversations/${c.id}`,
      })),
      ...events.map((e) => ({
        id: e.id,
        label: e.id,
        category: 'Events',
        path: `/editor/events/${e.id}`,
      })),
    ],
    [
      items,
      wearableTemplates,
      locations,
      encounters,
      quests,
      skills,
      scenes,
      scripts,
      shops,
      questTemplates,
      conversations,
      events,
    ],
  );
}

function GlobalSearchInner() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const results = useAllSearchData();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    for (const r of results) {
      const bucket = map.get(r.category) ?? [];
      bucket.push(r);
      map.set(r.category, bucket);
    }
    return map;
  }, [results]);

  function handleSelect(path: string) {
    void navigate(path);
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
        }}
        className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-750 hover:text-zinc-200"
      >
        <Search className="h-3 w-3" />
        <span>Search...</span>
        <kbd className="ml-1 inline-flex h-4 items-center rounded border border-zinc-600 bg-zinc-900 px-1 font-mono text-[10px] text-zinc-500">
          Ctrl K
        </kbd>
      </button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Navigate to any game entity"
        showCloseButton={false}
      >
        <CommandInput placeholder="Search entities..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {[...grouped.entries()].map(([category, items]) => (
            <CommandGroup key={category} heading={category}>
              {items.map((r) => (
                <CommandItem
                  key={r.path}
                  value={`${r.label} ${r.id} ${r.category}`}
                  onSelect={() => {
                    handleSelect(r.path);
                  }}
                >
                  <span>{r.label}</span>
                  {r.label !== r.id && (
                    <span className="ml-2 text-xs text-zinc-500">{r.id}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}

export function GlobalSearch() {
  return (
    <Suspense fallback={null}>
      <GlobalSearchInner />
    </Suspense>
  );
}
