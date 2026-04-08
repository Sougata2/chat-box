import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type VisibleMessageState = {
  messages: Set<string>;
};

const initialState: VisibleMessageState = {
  messages: new Set(),
};

const visibleMessageSlice = createSlice({
  initialState,
  name: "visibleMessage",
  reducers: {
    insert(state, action: PayloadAction<string>) {
      state.messages.add(action.payload);
    },
    remove(state, action: PayloadAction<string>) {
      state.messages.delete(action.payload);
    },
    reset(state) {
      state.messages.clear();
    },
  },
});

export const visibleMessageActions = visibleMessageSlice.actions;
export default visibleMessageSlice.reducer;
