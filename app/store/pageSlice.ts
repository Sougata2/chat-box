import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Page } from "../types/page";

export interface PageState {
  rooms: Page[];
  window: Page[];
}

const initialState: PageState = {
  rooms: [],
  window: [],
};

const rooms = {
  name: "room",
  import: "@/components/Rooms",
} as Page;

const pageSlice = createSlice({
  initialState,
  name: "page",
  reducers: {
    initializePages(state) {
      state.rooms.unshift(rooms);
    },
    pushRooms(state, action: PayloadAction<Page>) {
      state.rooms.push(action.payload);
    },
    popRooms(state) {
      state.rooms.shift();
    },
    pushWindow(state, action: PayloadAction<Page>) {
      state.window.unshift(action.payload);
    },
    popWindow(state) {
      state.window.shift();
    },
    resetWindow(state) {
      state.window = [];
    },
    resetRooms(state) {
      state.rooms = [rooms];
    },
  },
});

export const {
  initializePages,
  popRooms,
  popWindow,
  pushRooms,
  pushWindow,
  resetRooms,
  resetWindow,
} = pageSlice.actions;
export default pageSlice.reducer;
