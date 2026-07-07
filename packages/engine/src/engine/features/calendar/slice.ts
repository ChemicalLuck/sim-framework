import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { CalendarState, ScheduledEvent } from './types';

const initialState: CalendarState = { events: [] };

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    setCalendarEvents: (state, action: PayloadAction<ScheduledEvent[]>) => {
      state.events = action.payload;
    },
    addCalendarEvent: (state, action: PayloadAction<ScheduledEvent>) => {
      const event = action.payload;
      const index = state.events.findIndex((e) => e.id === event.id);
      if (index !== -1) {
        state.events[index] = event;
      } else {
        state.events.push(event);
      }
    },
    removeCalendarEvent: (state, action: PayloadAction<string>) => {
      state.events = state.events.filter((e) => e.id !== action.payload);
    },
    clearCalendarEvents: (state) => {
      state.events = [];
    },
  },
});

export const {
  setCalendarEvents,
  addCalendarEvent,
  removeCalendarEvent,
  clearCalendarEvents,
} = calendarSlice.actions;

export default calendarSlice.reducer;

declare module '@chemicalluck/sim-engine/state/store' {
  interface PresentState {
    calendar: ReturnType<typeof calendarSlice.reducer>;
  }
}
