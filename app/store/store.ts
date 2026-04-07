import { configureStore } from "@reduxjs/toolkit";

import pendingMessageReducer from "@/app/store/pendingMessageSlice";
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
    chat: chatReducer,
    page: pageReducer,
    rooms: roomReducer,
    typing: typingReducer,
    presence: presenceReducer,
    participants: participantReducer,
    pendingMessages: pendingMessageReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
