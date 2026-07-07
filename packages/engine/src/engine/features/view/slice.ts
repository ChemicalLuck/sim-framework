import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import type { Scene, Script } from '@chemicalluck/engine/types';

/**
 * Maps each view ID to its required props.
 * Game code can extend this via TypeScript module augmentation:
 *
 *   declare module '@chemicalluck/engine/features/view/slice' {
 *     interface ViewPropsMap {
 *       MyGameView: Record<string, never>;
 *     }
 *   }
 */
export interface ViewPropsMap {
  MainMenuView: Record<string, never>;
  CharacterCustomisationView: Record<string, never>;
  DefaultView: Record<string, never>;
  SceneView: { scene: Scene; npcIds?: string[] };
  ScriptView: { script: Script; npcIds?: string[] };
  OutfitView: Record<string, never>;
  NpcView: { npcId: string };
  ConversationView: { npcId: string };
  EncounterView: Record<string, never>;
}

export type ViewID = keyof ViewPropsMap;

export const VIEW_IDS = [
  'MainMenuView',
  'CharacterCustomisationView',
  'DefaultView',
  'SceneView',
  'ScriptView',
  'OutfitView',
  'ShopView',
  'NpcView',
  'ConversationView',
  'EncounterView',
] as const satisfies readonly ViewID[];

export const NPC_VIEW_IDS = new Set<ViewID>(['NpcView', 'ConversationView']);

export type ViewState = {
  [K in ViewID]: { activeViewId: K; props: ViewPropsMap[K] };
}[ViewID];

interface SliceState {
  activeViewId: string;
  description: string;
  props: Record<string, unknown>;
}

const initialState: SliceState = {
  activeViewId: 'MainMenuView',
  description: '',
  props: {},
};

const viewSlice = createSlice({
  name: 'view',
  initialState,
  reducers: {
    setView: (state, action: PayloadAction<ViewState>) => {
      state.activeViewId = action.payload.activeViewId;
      state.props = action.payload.props;
    },
    setDescription: (state, action: PayloadAction<string>) => {
      state.description = action.payload;
    },
  },
});

export const { setView, setDescription } = viewSlice.actions;

export default viewSlice.reducer;

declare module '@chemicalluck/engine/state/store' {
  interface PresentState {
    view: ReturnType<typeof viewSlice.reducer>;
  }
}
