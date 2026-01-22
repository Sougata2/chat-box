import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../types/user";

export interface UserState {
  user: User | null;
  accessToken: string | null;
  expireAt: string | null;
}

const initialState: UserState = {
  user: null,
  accessToken: null,
  expireAt: null,
};

const userSlice = createSlice({
  initialState,
  name: "user",
  reducers: {
    setAuth(state, action: PayloadAction<UserState>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.expireAt = action.payload.expireAt;
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },
    resetUser(state) {
      state.user = null;
      state.accessToken = null;
      state.expireAt = null;
    },
  },
});

export const { setAuth, setAccessToken, resetUser } = userSlice.actions;
export default userSlice.reducer;
