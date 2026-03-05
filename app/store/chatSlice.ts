import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Message, Room, User } from "@/types/types";
import { messageAdapter } from "./adapter/messageAdapter";

export interface chatState {
  room: Room | null;
  participants: User[];
  messages: ReturnType<typeof messageAdapter.getInitialState>;
}

const initialState: chatState = {
  room: null,
  participants: [],
  messages: messageAdapter.getInitialState(),
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
    setMessages(state, action: PayloadAction<Message[]>) {
      messageAdapter.setAll(state.messages, action.payload);
    },
    setMessage(state, action: PayloadAction<Message>) {
      messageAdapter.addOne(state.messages, action.payload);
    },
    updateMessage(state, action: PayloadAction<Message>) {
      messageAdapter.upsertOne(state.messages, action.payload);
    },
    resetChat(state) {
      state.room = null;
      messageAdapter.removeAll(state.messages);
    },
  },
});

export const {
  saveRoom,
  resetChat,
  setMessage,
  setMessages,
  updateMessage,
  savePartipants,
} = chatSlice.actions;
export default chatSlice.reducer;
