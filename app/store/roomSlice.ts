import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Message, Room } from "../types/room";

export interface roomState {
  references: string[];
  rooms: Record<string, Room>;
}

const initialState: roomState = {
  references: [],
  rooms: {},
};

const roomSlice = createSlice({
  initialState,
  name: "rooms",
  reducers: {
    setRooms(state, action: PayloadAction<roomState>) {
      state.rooms = action.payload.rooms;
      state.references = action.payload.references;
    },
    resetRooms(state) {
      state.rooms = {};
      state.references = [];
    },
    addRoom(state, action: PayloadAction<Room>) {
      const newRoom = action.payload;
      // state.references = [newRoom.referenceNumber, ...state.references];
      state.rooms = {
        ...state.rooms,
        [newRoom.referenceNumber]: { ...newRoom },
      };
    },
    updateLatestMessage(state, action: PayloadAction<Message>) {
      const message: Message = action.payload;
      const { referenceNumber } = action.payload.room;
      if (!referenceNumber) return;
      if (!state.rooms[referenceNumber]) {
        const newRoom: Room = {
          ...message.room,
          messages: { [message.uuid]: message },
          uuids: [message.uuid],
        };
        state.references.unshift(newRoom.referenceNumber);
        state.rooms[referenceNumber] = newRoom;
      } else {
        state.rooms[referenceNumber] = {
          ...state.rooms[referenceNumber],
          ...message.room,
          messages: { [message.uuid]: message },
          uuids: [message.uuid],
        };
        const index = state.references.indexOf(referenceNumber);
        state.references.splice(index, 1);
        state.references.unshift(referenceNumber);
      }
    },
  },
});

export const { setRooms, addRoom, resetRooms, updateLatestMessage } =
  roomSlice.actions;
export default roomSlice.reducer;
