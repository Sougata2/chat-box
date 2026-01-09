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
    unShiftMessageOrRefreshPendingChat(state, action: PayloadAction<Message>) {
      if (!state.room) return;
      if (!state.room.uuids) state.room.uuids = [];
      if (!state.room.messages) state.room.messages = {};

      if (!state.room.id) {
        state.room.id = action.payload.room.id;
      }

      const { uuid } = action.payload;

      if (!state.room.messages[uuid]) {
        state.room.uuids.unshift(uuid);
      }

      state.room.messages[uuid] = action.payload;
    },
  },
});

export const { selectRoom, unShiftMessageOrRefreshPendingChat } =
  chatSlice.actions;
export default chatSlice.reducer;
