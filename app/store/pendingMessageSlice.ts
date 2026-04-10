import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Message } from "@/types/types";

export type PendingMessagesState = {
  roomMessageMap: Record<string, Message[]>;
  uuidMessageMap: Record<string, Message>;
};

const initialState: PendingMessagesState = {
  roomMessageMap: {},
  uuidMessageMap: {},
};

function addMessageToState(state: PendingMessagesState, message: Message) {
  if (state.uuidMessageMap[message.uuid]) return;
  state.uuidMessageMap[message.uuid] = message;
  if (!message.roomRef) return;
  if (!state.roomMessageMap[message.roomRef])
    state.roomMessageMap[message.roomRef] = [] as Message[];
  state.roomMessageMap[message.roomRef].push(message);
}

const pendingMessageSlice = createSlice({
  initialState,
  name: "pendingMessages",
  reducers: {
    addOne(state, action: PayloadAction<Message>) {
      addMessageToState(state, action.payload);
    },
    addMany(state, action: PayloadAction<Message[]>) {
      const messages = action.payload;
      messages.forEach((message) => {
        addMessageToState(state, message);
      });
    },
    remove(state, action: PayloadAction<string>) {
      const messageUuid = action.payload;

      const message = state.uuidMessageMap[messageUuid];
      if (!message) return;

      if (!state.uuidMessageMap[message.uuid]) return;
      delete state.uuidMessageMap[message.uuid];

      if (!message.roomRef) return;

      const messages = state.roomMessageMap[message.roomRef];
      state.roomMessageMap[message.roomRef] = messages.filter(
        (m) => m.uuid !== message.uuid,
      );

      if (state.roomMessageMap[message.roomRef].length === 0) {
        delete state.roomMessageMap[message.roomRef];
      }
    },
  },
});

export const pendingMessageActions = pendingMessageSlice.actions;
export default pendingMessageSlice.reducer;
