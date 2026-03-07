import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { messageAdapter } from "./adapter/messageAdapter";
import { Message, Room } from "@/types/types";

export interface chatState {
  room: Room | null;
  messages: ReturnType<typeof messageAdapter.getInitialState>;
}

const initialState: chatState = {
  room: null,
  messages: messageAdapter.getInitialState(),
};

const chatSlice = createSlice({
  initialState,
  name: "chat",
  reducers: {
    saveRoom(state, action: PayloadAction<Room>) {
      state.room = action.payload;
    },
    setMessages(state, action: PayloadAction<Message[]>) {
      messageAdapter.setAll(state.messages, action.payload);
    },
    setMessage(state, action: PayloadAction<Message>) {
      messageAdapter.addOne(state.messages, action.payload);
    },
    updateMessage(state, action: PayloadAction<Message>) {
      // display the message in the chat window only if the message
      // belongs to the room.
      if (state.room?.referenceNumber !== action.payload.roomRef) return;
      messageAdapter.upsertOne(state.messages, action.payload);
    },
    resetChat(state) {
      state.room = null;
      messageAdapter.removeAll(state.messages);
    },
  },
});

export const { saveRoom, resetChat, setMessage, setMessages, updateMessage } =
  chatSlice.actions;
export default chatSlice.reducer;
