import { configureStore } from "@reduxjs/toolkit";

import participantReducer from "@/app/store/participantSlice";
import presenceReducer from "@/app/store/presenceSlice";
import typingReducer from "@/app/store/typingSlice";
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
    typing: typingReducer,
    presence: presenceReducer,
    participants: participantReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
