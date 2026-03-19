import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TypingDto } from "@/types/types";

export type TypingState = {
  typingMap: Record<string, string[]>;
};

const initialState: TypingState = {
  typingMap: {},
};

const typingSlice = createSlice({
  initialState,
  name: "typing",
  reducers: {
    addTyping(state, action: PayloadAction<TypingDto>) {
      const typing = action.payload;
      if (state.typingMap[typing.roomRef]) {
        if (!state.typingMap[typing.roomRef].includes(typing.username)) {
          state.typingMap[typing.roomRef].push(typing.username);
        }
      } else {
        state.typingMap[typing.roomRef] = [typing.username];
      }
    },
    removeTyping(state, action: PayloadAction<TypingDto>) {
      const typing = action.payload;
      if (!state.typingMap[typing.roomRef]) return;
      state.typingMap[typing.roomRef] = state.typingMap[typing.roomRef].filter(
        (u) => u !== typing.username,
      );
    },
  },
});

export const { addTyping, removeTyping } = typingSlice.actions;
export default typingSlice.reducer;
