import { Message, Receipt, Room } from "@/types/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type LastSeenPayload = {
  roomRef: string;
  lastSeen: string;
  count: number;
};

export type ReadReceiptState = {
  receiptMap: Record<string, Receipt>;
};

const initialState: ReadReceiptState = {
  receiptMap: {},
};

const readReceiptSlice = createSlice({
  initialState,
  name: "readReceipt",
  reducers: {
    register(state, action: PayloadAction<Receipt[]>) {
      const receipts = action.payload;
      receipts.forEach((receipt) => {
        state.receiptMap[receipt.roomRef] = {
          ...receipt,
          isActive: false,
          isAtBottom: false,
        };
      });
    },
    add(state, action: PayloadAction<Receipt>) {
      const roomRef = action.payload.roomRef;
      state.receiptMap[roomRef] = action.payload;
    },
    incrementCount(state, action: PayloadAction<Message>) {
      const message: Message = action.payload;
      if (!message.roomRef) return;
      if (state.receiptMap[message.roomRef]) {
        const receipt = state.receiptMap[message.roomRef];
        const userIsActive =
          receipt.isActive &&
          receipt.isAtBottom &&
          document.visibilityState === "visible";
        const counter = receipt.count;

        if (!userIsActive) {
          state.receiptMap[message.roomRef].count++;
        } else if (userIsActive && counter > 0) {
          state.receiptMap[message.roomRef].count++;
        }
      }
    },
    clearCount(state, action: PayloadAction<Room>) {
      const room = action.payload;
      if (!room.referenceNumber) return;

      const counter = state.receiptMap[room.referenceNumber].count;
      const isAtBottom = state.receiptMap[room.referenceNumber].isAtBottom;
      if (counter > 0 && isAtBottom)
        state.receiptMap[room.referenceNumber].count = 0;
    },
    setActive(state, action: PayloadAction<Room>) {
      const room = action.payload;
      if (!room.referenceNumber) return;
      state.receiptMap[room.referenceNumber].isActive = true;
    },
    setInactive(state, action: PayloadAction<Room>) {
      const room = action.payload;
      if (!room.referenceNumber) return;
      state.receiptMap[room.referenceNumber].isActive = false;
      state.receiptMap[room.referenceNumber].isAtBottom = false;

      if (
        room.lastMessage?.uuid &&
        state.receiptMap[room.referenceNumber].count === 0
      ) {
        state.receiptMap[room.referenceNumber].lastSeen = room.lastMessage.uuid;
      }
    },
    setAtBottom(state, action: PayloadAction<Room>) {
      const room = action.payload;
      if (!room.referenceNumber) return;
      state.receiptMap[room.referenceNumber].isAtBottom = true;
    },
    setNotAtBottom(state, action: PayloadAction<Room>) {
      const room = action.payload;
      if (!room.referenceNumber) return;
      state.receiptMap[room.referenceNumber].isAtBottom = false;
    },
    setLastSeen(state, action: PayloadAction<LastSeenPayload>) {
      const roomRef = action.payload.roomRef;
      const lastSeen = action.payload.lastSeen;
      const count = action.payload.count;

      if (state.receiptMap[roomRef]) {
        state.receiptMap[roomRef].count = count;
        state.receiptMap[roomRef].lastSeen = lastSeen;
      }
    },
  },
});

export const readReceiptActions = readReceiptSlice.actions;
export default readReceiptSlice.reducer;
