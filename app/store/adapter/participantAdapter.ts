import { createEntityAdapter } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { User } from "@/types/types";

export const participantAdapter = createEntityAdapter<User, string>({
  selectId: (user) => user?.email ?? "",
});

export const participantSelectors = participantAdapter.getSelectors<RootState>(
  (state) => state.participants,
);
