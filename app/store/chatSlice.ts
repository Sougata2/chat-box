import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { File, Message, Room } from "@/types/types";
import { messageAdapter } from "./adapter/messageAdapter";

export interface chatState {
  room: Room | null;
  files: Record<string, File[]>;
  messages: ReturnType<typeof messageAdapter.getInitialState>;
}

const initialState: chatState = {
  room: null,
  files: {},
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
    updateMessages(state, action: PayloadAction<Message[]>) {
      messageAdapter.upsertMany(state.messages, action.payload);
    },
    resetChat(state) {
      state.room = null;
      state.files = {};
      messageAdapter.removeAll(state.messages);
    },
    // FILES
    addFiles(state, action: PayloadAction<Record<string, File[]>>) {
      const [uuid, files] = Object.entries(action.payload)[0];
      files.forEach((file) => {
        if (!file.messageUUID) file.messageUUID = uuid;
      });
      state.files[uuid] = files;
    },
    setFiles(state, action: PayloadAction<File[]>) {
      const files = action.payload;
      const temp = {} as Record<string, File[]>;
      files.forEach((file) => {
        if (!file.messageUUID) return;
        if (Object.keys(temp).includes(file.messageUUID)) {
          temp[file.messageUUID].push(file);
        } else {
          temp[file.messageUUID] = [file] as File[];
        }
      });

      state.files = temp;
    },
  },
});

export const {
  saveRoom,
  resetChat,
  setMessage,
  setMessages,
  updateMessage,
  updateMessages,
  addFiles,
  setFiles,
} = chatSlice.actions;
export default chatSlice.reducer;
