import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Message, MessageMap, Room, User } from "@/types/types";

export interface chatState {
  room: Room | null;
  participants: User[];
  messageMap: MessageMap;
}

const initialState: chatState = {
  room: null,
  participants: [],
  messageMap: { uuids: [], messages: {} },
};

const chatSlice = createSlice({
  initialState,
  name: "chat",
  reducers: {
    saveRoom(state, action: PayloadAction<Room>) {
      state.room = action.payload;
    },
    savePartipants(state, action: PayloadAction<User[]>) {
      state.participants = action.payload;
    },
    setMessage(state, action: PayloadAction<Message>) {
      const uuid = action.payload.uuid;
      if (!uuid) return;

      state.messageMap.uuids.unshift(uuid);
      state.messageMap.messages[uuid] = action.payload;
    },
    updateMessage(state, action: PayloadAction<Message>) {
      const uuid = action.payload.uuid;
      if (!uuid) return;
      state.messageMap.messages[uuid] = action.payload;
    },
    resetChat(state) {
      state.room = null;
    },
  },
});

export const {
  saveRoom,
  resetChat,
  setMessage,
  updateMessage,
  savePartipants,
} = chatSlice.actions;
export default chatSlice.reducer;
