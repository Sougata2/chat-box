import { createEntityAdapter } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { Room } from "@/types/types";

export const roomAdapter = createEntityAdapter<Room, string>({
  selectId: (room) => room?.referenceNumber ?? "",
  sortComparer: (a, b) => {
    const aTime = a.lastMessage?.createdAt
      ? new Date(a.lastMessage.createdAt).getTime()
      : 0;

    const bTime = b.lastMessage?.createdAt
      ? new Date(b.lastMessage?.createdAt).getTime()
      : 0;
    return bTime - aTime;
  },
});

export const roomSelectors = roomAdapter.getSelectors<RootState>(
  (state) => state.rooms,
);
