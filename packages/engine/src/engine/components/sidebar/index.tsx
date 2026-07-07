import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@sim/engine/components/ui/sidebar';
import { ModeToggle } from '@sim/engine/components/ui/theme-toggle';
import MoneyDisplay from '@sim/engine/features/money/components/money-display';
import NeedsDisplay from '@sim/engine/features/needs/components/needs-display';
import PeopleDialog from '@sim/engine/features/npcs/components/people-dialog';
import AppearanceDisplay from '@sim/engine/features/player/components/appearance-display';
import QuestsDialog from '@sim/engine/features/quests/components/quest-dialog';
import ResetButton from '@sim/engine/features/save/components/reset-button';
import SaveLoadDialog from '@sim/engine/features/save/components/save-load-dialog';
import TimeDisplay from '@sim/engine/features/time/components/time-display';
import WeatherDisplay from '@sim/engine/features/weather/components/weather-display';
import { appName, version } from '@sim/engine/lib/core';

import BackButton from './back';
import EditorButton from './editor-button';
import WaitButton from './wait-button';

/** Engine-only sidebar — includes generic UI without game-specific sections.
 *  Games should provide their own sidebar via GameConfig.sidebar. */
export function GameSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-row items-center justify-center py-3">
        <span className="font-bold tracking-tight" hidden={!open}>
          {appName}
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <TimeDisplay />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <WeatherDisplay />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <AppearanceDisplay />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <MoneyDisplay />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <NeedsDisplay />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="grid gap-2 grid-cols-2">
              <PeopleDialog />
              <QuestsDialog />
              <WaitButton />
              <ResetButton />
              <EditorButton />
              <div className="col-span-2">
                <SaveLoadDialog />
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="flex flex-row items-center justify-end gap-2">
        <BackButton />
        <ModeToggle />
        <span className="text-xs opacity-60">{version}</span>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
