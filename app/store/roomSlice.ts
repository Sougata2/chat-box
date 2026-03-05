import { Message, Room } from "@/types/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface roomState {
  uuids: string[];
  rooms: Record<string, Room>;
}

const initialState: roomState = {
  uuids: [],
  rooms: {},
};

const roomSlice = createSlice({
  initialState,
  name: "rooms",
  reducers: {
    setRooms(state, action: PayloadAction<roomState>) {
      state.rooms = action.payload.rooms;
      state.uuids = action.payload.uuids;
    },
    resetRooms(state) {
      state.rooms = {};
      state.uuids = [];
    },
    /**
     * add new room to rooms array if not present.
     * NOTE : Room will be added at first index.
     */
    addRoom(state, action: PayloadAction<Room>) {
      const newRoom = action.payload;
      if (!newRoom.referenceNumber) return;
      state.uuids = [newRoom.referenceNumber, ...state.uuids];
      state.rooms = {
        ...state.rooms,
        [newRoom.referenceNumber]: { ...newRoom },
      };
    },
    /**
     * put the room at first index of the room.
     * also update the latest message.
     */
    unShiftRoom(state, action: PayloadAction<Message>) {
      const message = action.payload;
      const uuids = [...state.uuids];

      if (!message.roomRef) return;

      const index = uuids.indexOf(message.roomRef);

      if (!index) return;

      uuids.splice(index, 1);

      uuids.unshift(message.roomRef);

      state.uuids = uuids;

      state.rooms[message.roomRef].lastMessage = action.payload;
    },
  },
});

export const { setRooms, addRoom, unShiftRoom, resetRooms } = roomSlice.actions;
export default roomSlice.reducer;
