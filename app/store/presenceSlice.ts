import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type presenceStatus = "ONLINE" | "OFFLINE";

export interface presenceData {
  status: presenceStatus;
  lastSeen: string;
}

export interface presencePayload {
  username: string;
  data: presenceData;
}

export interface PresenceDto {
  username: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface PresenceState {
  presenceMap: Record<string, presenceData>;
}

const initialState: PresenceState = {
  presenceMap: {},
};

const presenceSlice = createSlice({
  initialState,
  name: "presence",
  reducers: {
    registerPresence(state, action: PayloadAction<PresenceDto[]>) {
      const dtos = action.payload;
      const presenceMap = {} as Record<string, presenceData>;
      for (let i = 0; i < dtos.length; i++) {
        presenceMap[dtos[i].username] = {
          status: dtos[i].isOnline ? "ONLINE" : "OFFLINE",
          lastSeen: dtos[i].lastSeen,
        } as presenceData;
      }
      state.presenceMap = presenceMap;
    },
    updatePresence(state, action: PayloadAction<presencePayload>) {
      const {
        username,
        data: { status, lastSeen },
      } = action.payload;
      state.presenceMap[username] = { status, lastSeen } as presenceData;
    },
  },
});

export const { registerPresence, updatePresence } = presenceSlice.actions;
export default presenceSlice.reducer;
