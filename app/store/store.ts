import { configureStore } from "@reduxjs/toolkit";
import userReducer from "@/app/store/userSlice";
import roomReducer from "@/app/store/roomSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    rooms: roomReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
