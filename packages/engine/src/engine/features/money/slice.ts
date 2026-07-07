import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import { makeConfig } from '@chemicalluck/sim-engine/lib/core';

const _money = makeConfig(0);

export const configureMoney = _money.configure;

const moneySlice = createSlice({
  name: 'money',
  initialState: () => _money.get(),
  reducers: {
    increaseMoneyByAmount: (state, action: PayloadAction<number>) =>
      (state += action.payload),
  },
});

export const { increaseMoneyByAmount } = moneySlice.actions;

export default moneySlice.reducer;

declare module '@chemicalluck/sim-engine/state/store' {
  interface PresentState {
    money: ReturnType<typeof moneySlice.reducer>;
  }
}
