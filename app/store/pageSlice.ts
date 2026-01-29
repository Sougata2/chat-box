import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Page, PageLocator } from "../types/page";

export interface PageState {
  rooms: Page[];
  window: Page[];
  profile: Page[];
}

const initialState: PageState = {
  rooms: [],
  window: [],
  profile: [],
};

const rooms = {
  name: "room",
  import: "@/components/Rooms",
  closeable: false,
} as Page;

const profile = {
  name: "profile",
  import: "@/components/Profile",
  closeable: false,
} as Page;

const pageSlice = createSlice({
  initialState,
  name: "page",
  reducers: {
    initializePages(state) {
      state.rooms.unshift(rooms);
      state.profile.unshift(profile);
    },
    stackPage(state, action: PayloadAction<PageLocator>) {
      const stack = action.payload.stack;
      const page = action.payload.page;

      if (!page) {
        throw new Error("Page is not available");
      }

      if (state[stack].length > 0 && state[stack][0].import === page.import) {
        return;
      } else {
        state[stack].unshift(page);
      }
    },
    popPage(state, action: PayloadAction<PageLocator>) {
      const stack = action.payload.stack;
      state[stack].pop();
    },
    resetStack(state, action: PayloadAction<PageLocator>) {
      const stack = action.payload.stack;
      const defaultPage = action.payload.defaultPage;

      if (defaultPage) {
        state[stack] = [defaultPage];
      } else {
        state[stack] = [];
      }
    },
  },
});

export const { popPage, stackPage, resetStack, initializePages } =
  pageSlice.actions;
export default pageSlice.reducer;
