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
      if (!state.room.uuids) state.room.uuids = [];
      if (!state.room.messages) state.room.messages = {};

      const { uuid } = action.payload;

      if (!state.room.messages[uuid]) {
        state.room.uuids.unshift(uuid);
      }

      state.room.messages[uuid] = action.payload;
    },
    refreshPendingMessage(state, action: PayloadAction<Message>) {
      // if (!state.room?.messages) return;
      // const index = state.room.messages.findIndex(
      //   (m: Message) => !m.createdAt && m.uuid === action.payload.uuid
      // );
      // if (index !== -1) {
      //   state.room.messages[index] = action.payload;
      // }
    },
  },
});

export const { selectRoom, unShiftMessage } = chatSlice.actions;
export default chatSlice.reducer;
