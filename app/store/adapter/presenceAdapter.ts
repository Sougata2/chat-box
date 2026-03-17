import { createEntityAdapter } from "@reduxjs/toolkit";
import { PresenceDto } from "@/types/types";
import { RootState } from "../store";

export const presenceAdapter = createEntityAdapter<PresenceDto, string>({
  selectId: (state) => state.username,
});

export const presenceSelector = presenceAdapter.getSelectors<RootState>(
  (state) => state.presence,
);
