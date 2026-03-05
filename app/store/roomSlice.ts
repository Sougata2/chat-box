import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Message, Room } from "@/types/types";
import { roomAdapter } from "./adapter/roomAdapter";

const initialState = roomAdapter.getInitialState();

const roomSlice = createSlice({
  initialState,
  name: "rooms",
  reducers: {
    setRooms(state, action: PayloadAction<Room[]>) {
      roomAdapter.setAll(state, action.payload);
    },
    addRoom(state, action: PayloadAction<Room>) {
      roomAdapter.addOne(state, action.payload);
    },
    resetRooms(state) {
      roomAdapter.removeAll(state);
    },
    refreshRooms(state, action: PayloadAction<Message>) {
      const message = action.payload;

      if (!message.roomRef) return;

      const room = state.entities[message.roomRef];

      if (!room) return;

      roomAdapter.updateOne(state, {
        id: message.roomRef,
        changes: {
          lastMessage: message,
        },
      });
    },
  },
});

export const { setRooms, addRoom, resetRooms, refreshRooms } =
  roomSlice.actions;
export default roomSlice.reducer;
