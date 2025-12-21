import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Room } from "../types/room";

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
  },
});

export const { setRooms, resetRooms } = roomSlice.actions;
export default roomSlice.reducer;
