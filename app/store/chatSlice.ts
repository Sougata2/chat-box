import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Room } from "../types/room";

export interface chatState {
  room: Room | null;
}

const initialState: chatState = {
  room: null,
};

const chatSlice = createSlice({
  initialState,
  name: "chat",
  reducers: {
    selectRoom(state, action: PayloadAction<Room>) {
      state.room = action.payload;
    },
  },
});

export const { selectRoom } = chatSlice.actions;
export default chatSlice.reducer;
