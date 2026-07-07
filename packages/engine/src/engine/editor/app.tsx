import { type CSSProperties, Suspense } from 'react';
import {
  NavLink,
  Navigate,
  Outlet,
  RouterProvider,
  createBrowserRouter,
  useBlocker,
  useLocation,
} from 'react-router';
import { Toaster } from 'sonner';
import editorExtensions from 'virtual:editor-extensions';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from '@sim/engine/components/ui/sidebar';

import { GlobalSearch } from './components/global-search';
import {
  ConfirmDialog,
  PanelErrorBoundary,
  PanelSkeleton,
  SaveBar,
} from './components/panel-layout';
import { PreviewStateProvider } from './components/preview/mock-state';
import { ProblemsButton } from './components/problems-button';
import { PanelFileProvider } from './lib/panel-file';
import { SaveHandlerProvider, useSaveContext } from './lib/save-context';
import {
  UnsavedChangesProvider,
  useUnsavedChanges,
} from './lib/unsaved-changes';
import { preloadEditorData, useDataEpoch } from './lib/use-editor-data';
import { ValidationProvider, useValidationIssues } from './lib/validation';

// Kick off all fetches immediately so panels never waterfall
const _seen = new Set<string>();
preloadEditorData(
  ...(editorExtensions.dataRequirements ?? [])
    .filter((r) => (_seen.has(r.key) ? false : _seen.add(r.key)))
    .map((r) => `/editor/api/data/${r.key}`),
);

interface TabGroup {
  name: string;
  tabs: Tab[];
}

interface Tab {
  path: string;
  label: string;
  file?: string;
  component: React.ComponentType;
}

// Group seeds fix the sidebar ordering; their panels are contributed by
// feature editor modules (scenes/scripts now live in the `core` feature).
const CORE_TABS: TabGroup[] = [
  { name: 'Core', tabs: [] },
  { name: 'Narrative', tabs: [] },
  { name: 'Characters', tabs: [] },
];

// Merge feature/extension panels into tab groups by declared group name.
// Panels without a recognised group fall into a catch-all Extensions group.
const groupMap = new Map<string, Tab[]>(
  CORE_TABS.map(({ name, tabs }) => [name, [...tabs]]),
);
const ungroupedTabs: Tab[] = [];
for (const [panelPath, panel] of Object.entries(
  editorExtensions.panels ?? {},
) as [
  string,
  {
    label: string;
    group?: string;
    file?: string;
    component: React.ComponentType;
  },
][]) {
  const tab: Tab = {
    path: panelPath,
    label: panel.label,
    file: panel.file,
    component: panel.component,
  };
  const targetGroup = panel.group;
  if (targetGroup) {
    let group = groupMap.get(targetGroup);
    if (!group) {
      group = [];
      groupMap.set(targetGroup, group);
    }
    group.push(tab);
  } else {
    ungroupedTabs.push(tab);
  }
}

const TAB_GROUPS: TabGroup[] = [
  ...Array.from(groupMap.entries()).map(([name, tabs]) => ({ name, tabs })),
  ...(ungroupedTabs.length > 0
    ? [{ name: 'Extensions', tabs: ungroupedTabs }]
    : []),
];

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppLayout />,
      children: [
        { index: true, element: <Navigate to="world" replace /> },
        ...TAB_GROUPS.flatMap((group) => group.tabs).map((tab) => ({
          path: `${tab.path}/:entryId?`,
          element: <PanelRoute tab={tab} />,
        })),
      ],
    },
  ],
  { basename: '/editor' },
);

export default function App() {
  return <RouterProvider router={router} />;
}

// Renders a panel, supplying its data file via context (so the panel and the
// shared hook stay literal-free) and re-mounting it whenever the data epoch
// bumps — i.e. after a cross-file mutation such as a rename — so it re-seeds
// from the refreshed cache.
function PanelRoute({ tab }: { tab: Tab }) {
  const epoch = useDataEpoch();
  const content = (
    <PanelErrorBoundary key={epoch}>
      <Suspense fallback={<PanelSkeleton />}>
        <tab.component />
      </Suspense>
    </PanelErrorBoundary>
  );
  return tab.file ? (
    <PanelFileProvider file={tab.file}>{content}</PanelFileProvider>
  ) : (
    content
  );
}

function AppLayout() {
  return (
    <UnsavedChangesProvider>
      <SaveHandlerProvider>
        <ValidationProvider>
          <PreviewStateProvider>
            <Toaster theme="dark" position="bottom-right" />
            <div className="h-screen flex flex-col overflow-hidden">
              <TopBar />
              <SidebarProvider
                style={{ '--sidebar-width': '200px' } as CSSProperties}
                className="flex-1 min-h-0"
              >
                <AppSidebar />
                <SidebarInset className="overflow-hidden">
                  <Outlet />
                </SidebarInset>
              </SidebarProvider>
            </div>
            <RouterBlocker />
          </PreviewStateProvider>
        </ValidationProvider>
      </SaveHandlerProvider>
    </UnsavedChangesProvider>
  );
}

function TopBar() {
  const { dirty, discardAll } = useUnsavedChanges();
  const { saving, saveAll } = useSaveContext();
  return (
    <div className="grid grid-cols-3 items-center h-10 px-4 border-b border-zinc-700 shrink-0 bg-zinc-900">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-zinc-200">Game Editor</span>
        <ProblemsButton />
      </div>
      <div className="flex justify-center">
        <GlobalSearch />
      </div>
      <div className="flex justify-end">
        <SaveBar
          dirty={dirty}
          saving={saving}
          onSave={saveAll}
          onDiscard={discardAll}
        />
      </div>
    </div>
  );
}

function AppSidebar() {
  const location = useLocation();
  const issues = useValidationIssues();

  const countsBySection = issues.reduce<Record<string, number>>(
    (acc, issue) => {
      acc[issue.section] = (acc[issue.section] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return (
    <Sidebar collapsible="none">
      <SidebarContent>
        {TAB_GROUPS.map((group) => (
          <SidebarGroup key={group.name}>
            <SidebarGroupLabel>{group.name}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.tabs.map((tab) => {
                  const isActive =
                    location.pathname === `/${tab.path}` ||
                    location.pathname.startsWith(`/${tab.path}/`);
                  const problemCount = countsBySection[tab.path] ?? 0;
                  return (
                    <SidebarMenuItem key={tab.path}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={tab.label}
                      >
                        <NavLink to={tab.path}>
                          <span className="flex-1">{tab.label}</span>
                          {problemCount > 0 && (
                            <span
                              className="ml-auto rounded-full bg-red-900/70 px-1.5 text-[10px] font-medium text-red-300"
                              title={`${String(problemCount)} data problem${problemCount === 1 ? '' : 's'}`}
                            >
                              {problemCount}
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

function RouterBlocker() {
  const { dirty, discardAll } = useUnsavedChanges();
  const blocker = useBlocker(dirty);

  if (blocker.state !== 'blocked') return null;

  return (
    <ConfirmDialog
      open
      title="Discard unsaved changes?"
      description="You have unsaved changes in this panel. Navigating will discard them."
      onConfirm={() => {
        discardAll();
        blocker.proceed();
      }}
      onCancel={() => {
        blocker.reset();
      }}
    />
  );
}
