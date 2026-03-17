import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { presenceAdapter } from "./adapter/presenceAdapter";
import { PresenceDto } from "@/types/types";

const initialState = presenceAdapter.getInitialState();

const presenceSlice = createSlice({
  initialState,
  name: "presence",
  reducers: {
    setPresence(state, action: PayloadAction<PresenceDto[]>) {
      presenceAdapter.setAll(state, action.payload);
    },
    addPresence(state, action: PayloadAction<PresenceDto>) {
      presenceAdapter.addOne(state, action.payload);
    },
    updatePresence(state, action: PayloadAction<PresenceDto>) {
      presenceAdapter.updateOne(state, {
        id: action.payload.username,
        changes: action.payload,
      });
    },
  },
});

export const { setPresence, addPresence, updatePresence } =
  presenceSlice.actions;
export default presenceSlice.reducer;
