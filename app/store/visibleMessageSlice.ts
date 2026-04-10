import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type VisibleMessageState = {
  messages: Record<string, boolean>;
};

const initialState: VisibleMessageState = {
  messages: {},
};

const visibleMessageSlice = createSlice({
  initialState,
  name: "visibleMessage",
  reducers: {
    insert(state, action: PayloadAction<string>) {
      if (state.messages[action.payload]) return;
      state.messages[action.payload] = true;
    },
    remove(state, action: PayloadAction<string>) {
      state.messages[action.payload] = false;
    },
    reset(state) {
      state.messages = {};
    },
  },
});

export const visibleMessageActions = visibleMessageSlice.actions;
export default visibleMessageSlice.reducer;
