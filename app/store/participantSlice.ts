import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { participantAdapter } from "./adapter/participantAdapter";
import { User } from "@/types/types";

const initialState = participantAdapter.getInitialState();

const participantSlice = createSlice({
  initialState,
  name: "participants",
  reducers: {
    setParticipants(state, action: PayloadAction<User[]>) {
      participantAdapter.setAll(state, action.payload);
    },
    addParticipant(state, action: PayloadAction<User>) {
      participantAdapter.addOne(state, action.payload);
    },
    restParticipants(state) {
      participantAdapter.removeAll(state);
    },
  },
});

export const { setParticipants, addParticipant, restParticipants } =
  participantSlice.actions;
export default participantSlice.reducer;
