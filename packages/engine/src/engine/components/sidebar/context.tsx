import React, { createContext, use } from 'react';

import { GameSidebar as DefaultSidebar } from './index';

export const SidebarComponentContext =
  createContext<React.ComponentType>(DefaultSidebar);

export function useSidebarComponent(): React.ComponentType {
  return use(SidebarComponentContext);
}
