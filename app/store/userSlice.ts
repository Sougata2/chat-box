import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../types/user";
import { Room } from "../types/room";

interface UserState {
  user: User | null;
  rooms: Room[];
}

const initialState: UserState = {
  user: null,
  rooms: [],
};

const userSlice = createSlice({
  initialState,
  name: "user",
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    setRooms(state, action: PayloadAction<Room[]>) {
      state.rooms = action.payload;
    },
    resetUser(state) {
      state.user = null;
      state.rooms = [];
    },
  },
});

export const { setUser, resetUser } = userSlice.actions;
export default userSlice.reducer;
