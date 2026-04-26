import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Message } from "@/types/types";

export type PendingMessagesState = {
  roomMessageMap: Record<string, Message[]>;
  uuidMessageMap: Record<string, Message>;
  messageViewMap: Record<string, boolean>;
};

const initialState: PendingMessagesState = {
  roomMessageMap: {},
  uuidMessageMap: {},
  messageViewMap: {},
};

function addMessageToState(state: PendingMessagesState, message: Message) {
  if (state.uuidMessageMap[message.uuid]) return;
  state.uuidMessageMap[message.uuid] = message;
  state.messageViewMap[message.uuid] = false;
  if (!message.roomRef) return;
  if (!state.roomMessageMap[message.roomRef])
    state.roomMessageMap[message.roomRef] = [] as Message[];
  state.roomMessageMap[message.roomRef].push(message);
}

function removeMessageFromState(
  state: PendingMessagesState,
  messageUuid: string,
) {
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
}

function markAsSeen(uuid: string, state: PendingMessagesState) {
  state.messageViewMap[uuid] = true;
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
      removeMessageFromState(state, action.payload);
    },
    removeAll(state, action: PayloadAction<string[]>) {
      action.payload.forEach((messageUuid) => {
        removeMessageFromState(state, messageUuid);
      });
    },
    markAsSeenAll(state, action: PayloadAction<string[]>) {
      const uuids = action.payload;
      uuids.forEach((uuid) => {
        markAsSeen(uuid, state);
      });
    },
    markAsSeenOne(state, action: PayloadAction<string>) {
      const uuid = action.payload;
      markAsSeen(uuid, state);
    },
    clearPendingMessages(state, action: PayloadAction<string>) {
      const roomRef = action.payload;
      if (!state.roomMessageMap[roomRef]) return;
      if (state.roomMessageMap[roomRef].length === 0) return;
      state.roomMessageMap[roomRef] = [];
    },
  },
});

export const pendingMessageActions = pendingMessageSlice.actions;
export default pendingMessageSlice.reducer;
