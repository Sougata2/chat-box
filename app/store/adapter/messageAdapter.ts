import { createEntityAdapter } from "@reduxjs/toolkit";
import { Message } from "@/types/types";
import { RootState } from "../store";

export const messageAdapter = createEntityAdapter<Message, string>({
  selectId: (message) => message.uuid,
  sortComparer: (a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return aTime - bTime;
  },
});

export const messageSelectors = messageAdapter.getSelectors<RootState>(
  (state) => state.chat.messages,
);
