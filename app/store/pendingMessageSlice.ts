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
    // TODO: REMOVE READ MESSAGES FROM THE STATE.
  },
});

export const pendingMessageActions = pendingMessageSlice.actions;
export default pendingMessageSlice.reducer;
