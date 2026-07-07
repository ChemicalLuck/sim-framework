import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import type { ObjectiveState, Quest } from '@sim/engine/features/quests/types';

const questsSlice = createSlice({
  name: 'quests',
  initialState: [] as Quest[],
  reducers: {
    loadQuests: (_state, action: PayloadAction<Quest[]>) => {
      return action.payload;
    },
    addQuest: (state, action: PayloadAction<Quest>) => {
      state.push(action.payload);
    },
    updateQuestObjective: (
      state,
      action: PayloadAction<{
        questId: string;
        objectiveName: string;
        objectiveState: ObjectiveState;
      }>,
    ) => {
      const { questId, objectiveName, objectiveState } = action.payload;
      const quest = state.find((q) => q.id === questId);
      if (!quest) return;
      const objective = quest.objectives.find((o) => o.name === objectiveName);
      if (!objective) return;
      objective.state = objectiveState;
    },
  },
});

export const { loadQuests, addQuest, updateQuestObjective } =
  questsSlice.actions;

export default questsSlice.reducer;

declare module '@sim/engine/state/store' {
  interface PresentState {
    quests: ReturnType<typeof questsSlice.reducer>;
  }
}
