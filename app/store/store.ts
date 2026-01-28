import { configureStore } from "@reduxjs/toolkit";
import userReducer from "@/app/store/userSlice";
import roomReducer from "@/app/store/roomSlice";
import chatReducer from "@/app/store/chatSlice";
import pageReducer from "@/app/store/pageSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    rooms: roomReducer,
    chat: chatReducer,
    page: pageReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
