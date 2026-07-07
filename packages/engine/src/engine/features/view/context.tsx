import { createContext, use } from 'react';

export type ViewsRegistry = Partial<Record<string, React.ComponentType<never>>>;

export const ViewsContext = createContext<ViewsRegistry>({});

export function useViews(): ViewsRegistry {
  return use(ViewsContext);
}
