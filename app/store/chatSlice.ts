import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Message, Room } from "../types/room";

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
    unShiftMessage(state, action: PayloadAction<Message>) {
      if (!state.room) return;
      if (!state.room.messages) state.room.messages = [];
      state.room.messages.unshift(action.payload);
    },
    refreshPendingMessage(state, action: PayloadAction<Message>) {
      state.room?.messages.forEach((m: Message) => {
        if (m.uuid === action.payload.uuid) m = action.payload;
      });
    },
  },
});

export const { selectRoom, unShiftMessage } = chatSlice.actions;
export default chatSlice.reducer;
