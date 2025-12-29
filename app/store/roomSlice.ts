import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Message, Room } from "../types/room";

export interface roomState {
  rooms: Room[];
}

const initialState: roomState = {
  rooms: [],
};

const roomSlice = createSlice({
  initialState,
  name: "rooms",
  reducers: {
    setRooms(state, action: PayloadAction<Room[]>) {
      state.rooms = action.payload;
    },
    resetRooms(state) {
      state.rooms = [];
    },
    addStreamedMessage(state, action: PayloadAction<Message>) {
      // if room exist for this user
      const room = state.rooms.find(
        (r) => r.referenceNumber === action.payload.room.referenceNumber
      );

      if (room) room.messages = [action.payload];
    },
    refreshLatestMessage(state, action: PayloadAction<Message>) {
      const room = state.rooms.find(
        (r: Room) => r.referenceNumber === action.payload.room.referenceNumber
      ) as Room;

      room.messages =
        room.messages[0].uuid === action.payload.uuid
          ? [action.payload]
          : [room.messages[0]];
    },
  },
});

export const { setRooms, resetRooms, addStreamedMessage } = roomSlice.actions;
export default roomSlice.reducer;
